module thedrop::library {

    use std::string::String;

    const E_NOT_OWNER: u64 = 1;
    const E_TRACK_NOT_FOUND: u64 = 2;
    const E_UNSUPPORTED_FORMAT: u64 = 3;
    const E_TRACK_ALREADY_EXISTS: u64 = 4;

    const FORMAT_MP3: u8 = 0;
    const FORMAT_WAV: u8 = 1;
    const FORMAT_FLAC: u8 = 2;
    const FORMAT_AIFF: u8 = 3;

    /// Metadata describing a single audio track stored off-chain (e.g. on Walrus).
    public struct Track has store, drop {
        track_id: String,
        title: String,
        artist: String,
        album: String,
        vault_id: String,
        duration_ms: u64,
        format: u8,
        cover_uri: String,
        imported_at_epoch: u64,
    }

    /// User owned library aggregating locally imported tracks.
    public struct Library has key {
        id: sui::object::UID,
        owner: address,
        tracks: vector<Track>,
        track_count: u64,
        last_updated_epoch: u64,
    }

    /// Creates a fresh library object owned by the transaction sender.
    public entry fun create_library(ctx: &mut sui::tx_context::TxContext) {
        let sender = sui::tx_context::sender(ctx);
        let now = sui::tx_context::epoch(ctx);
        let library = Library {
            id: sui::object::new(ctx),
            owner: sender,
            tracks: vector::empty<Track>(),
            track_count: 0,
            last_updated_epoch: now,
        };
        sui::transfer::transfer(library, sender);
    }

    /// Adds a new track to the given library. Fails if the caller does not own the library,
    /// the supplied format is not supported, or if a track with the same id already exists.
    public entry fun add_track(
        library: &mut Library,
        track_id: String,
        title: String,
        artist: String,
        album: String,
        vault_id: String,
        duration_ms: u64,
        format: u8,
        cover_uri: String,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        ensure_owner(library, ctx);
        assert_supported_format(format);

        assert_unique_track(&library.tracks, &track_id, &vault_id);

        let now = sui::tx_context::epoch(ctx);
        let track = Track {
            track_id,
            title,
            artist,
            album,
            vault_id,
            duration_ms,
            format,
            cover_uri,
            imported_at_epoch: now,
        };

        vector::push_back(&mut library.tracks, track);
        library.track_count = vector::length(&library.tracks);
        library.last_updated_epoch = now;
    }

    /// Updates track metadata. Only owner can mutate. Supported formats enforced.
    public entry fun update_track(
        library: &mut Library,
        track_id: String,
        new_title: String,
        new_artist: String,
        new_album: String,
        new_vault_id: String,
        new_duration_ms: u64,
        new_format: u8,
        new_cover_uri: String,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        ensure_owner(library, ctx);
        assert_supported_format(new_format);

        let idx_opt = find_track_index(&library.tracks, &track_id);
        let idx = expect_index(idx_opt);

        ensure_unique_vault_for_update(&library.tracks, idx, &new_vault_id);

        let track_ref = vector::borrow_mut(&mut library.tracks, idx);
        track_ref.title = new_title;
        track_ref.artist = new_artist;
        track_ref.album = new_album;
        track_ref.vault_id = new_vault_id;
        track_ref.duration_ms = new_duration_ms;
        track_ref.format = new_format;
        track_ref.cover_uri = new_cover_uri;
        let now = sui::tx_context::epoch(ctx);
        track_ref.imported_at_epoch = now;

        library.last_updated_epoch = now;
    }

    /// Removes a track from the library using its identifier.
    public entry fun remove_track(
        library: &mut Library,
        track_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        ensure_owner(library, ctx);

        let idx_opt = find_track_index(&library.tracks, &track_id);
        let idx = expect_index(idx_opt);

        let _removed = vector::remove(&mut library.tracks, idx);
        library.track_count = vector::length(&library.tracks);
        library.last_updated_epoch = sui::tx_context::epoch(ctx);
    }

    /// Clears the library while preserving the object and owner relationship.
    public entry fun reset_library(
        library: &mut Library,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        ensure_owner(library, ctx);

        library.tracks = vector::empty<Track>();
        library.track_count = 0;
        library.last_updated_epoch = sui::tx_context::epoch(ctx);
    }

    /// Destroys an empty library. Panics if tracks are still present.
    public entry fun destroy_library(
        library: Library,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        let Library { id, owner, tracks, track_count, .. } = library;
        assert!(owner == sui::tx_context::sender(ctx), E_NOT_OWNER);
        assert!(track_count == 0, E_TRACK_NOT_FOUND);
        vector::destroy_empty(tracks);
        sui::object::delete(id);
    }

    fun ensure_owner(library: &Library, ctx: &sui::tx_context::TxContext) {
        let sender = sui::tx_context::sender(ctx);
        assert!(sender == library.owner, E_NOT_OWNER);
    }

    fun assert_supported_format(format: u8) {
        let supported =
            format == FORMAT_MP3 ||
            format == FORMAT_WAV ||
            format == FORMAT_FLAC ||
            format == FORMAT_AIFF;
        if (!supported) {
            abort E_UNSUPPORTED_FORMAT
        }
    }

    fun assert_unique_track(tracks: &vector<Track>, track_id: &String, vault_id: &String) {
        let len = vector::length(tracks);
        let mut i = 0;
        while (i < len) {
            let track_ref = vector::borrow(tracks, i);
            if (track_ref.track_id == *track_id) {
                abort E_TRACK_ALREADY_EXISTS
            };
            if (track_ref.vault_id == *vault_id) {
                abort E_TRACK_ALREADY_EXISTS
            };
            i = i + 1;
        };
    }

    fun ensure_unique_vault_for_update(tracks: &vector<Track>, skip_idx: u64, vault_id: &String) {
        let len = vector::length(tracks);
        let mut i = 0;
        while (i < len) {
            if (i != skip_idx) {
                let track_ref = vector::borrow(tracks, i);
                if (track_ref.vault_id == *vault_id) {
                    abort E_TRACK_ALREADY_EXISTS
                };
            };
            i = i + 1;
        };
    }

    fun find_track_index(tracks: &vector<Track>, track_id: &String): option::Option<u64> {
        let len = vector::length(tracks);
        let mut i = 0;
        while (i < len) {
            let track_ref = vector::borrow(tracks, i);
            if (track_ref.track_id == *track_id) {
                return option::some(i)
            };
            i = i + 1;
        };
        option::none()
    }

    fun expect_index(opt: option::Option<u64>): u64 {
        let mut tmp = opt;
        if (!option::is_some(&tmp)) {
            abort E_TRACK_NOT_FOUND
        };
        option::extract(&mut tmp)
    }

}
