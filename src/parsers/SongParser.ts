import {
	AlbumBasic,
	ArtistBasic,
	SongDetailed,
	SongFull,
	ThumbnailFull,
} from "../types";
import checkType from "../utils/checkType";
import { isAlbum, isArtist, isDuration, isTitle } from "../utils/filters";
import { traverseList, traverseString } from "../utils/traverse";
import Parser from "./Parser";

export default class SongParser {
	// =========================================
	// 🔥 HELPERS
	// =========================================
	private static isValidVideoId(id: any): boolean {
		return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);
	}

	// =========================================
	// 🎵 FULL SONG (player endpoint)
	// =========================================
	public static parse(data: any): SongFull {
		const videoId = traverseString(data, "videoDetails", "videoId");

		if (!this.isValidVideoId(videoId)) {
			throw new Error(`Invalid videoId: ${videoId}`);
		}

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(data, "videoDetails", "title"),
				artist: {
					name: traverseString(data, "author"),
					artistId: traverseString(data, "videoDetails", "channelId"),
				},
				duration: +traverseString(data, "videoDetails", "lengthSeconds"),
				thumbnails: traverseList(data, "videoDetails", "thumbnails"),
				formats: traverseList(data, "streamingData", "formats"),
				adaptiveFormats: traverseList(
					data,
					"streamingData",
					"adaptiveFormats",
				),
			},
			SongFull,
		);
	}

	// =========================================
	// 🔍 SEARCH RESULT (CRÍTICO)
	// =========================================
	public static parseSearchResult(item: any): SongDetailed | null {
		const columns = traverseList(item, "flexColumns", "runs");

		const title = columns[0];
		const artist = columns.find(isArtist) || columns[3];
		const album = columns.find(isAlbum) ?? null;
		const duration = columns.find(isDuration);

		const videoId =
			traverseString(item, "playlistItemData", "videoId") ||
			traverseString(item, "videoId");

		// 💣 FILTRO CRÍTICO (SEU BUG RESOLVIDO AQUI)
		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(title, "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				album: album
					? {
							name: traverseString(album, "text"),
							albumId: traverseString(album, "browseId"),
						}
					: null,
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		);
	}

	// =========================================
	// 👤 ARTIST SONG
	// =========================================
	public static parseArtistSong(
		item: any,
		artistBasic: ArtistBasic,
	): SongDetailed | null {
		const columns = traverseList(item, "flexColumns", "runs").flat();

		const title = columns.find(isTitle);
		const album = columns.find(isAlbum);
		const duration = columns.find(isDuration);

		const videoId = traverseString(item, "playlistItemData", "videoId");

		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: album
					? {
							name: traverseString(album, "text"),
							albumId: traverseString(album, "browseId"),
						}
					: null,
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		);
	}

	// =========================================
	// 🔥 TOP SONG (artist page)
	// =========================================
	public static parseArtistTopSong(
		item: any,
		artistBasic: ArtistBasic,
	): SongDetailed | null {
		const columns = traverseList(item, "flexColumns", "runs").flat();

		const title = columns.find(isTitle);
		const album = columns.find(isAlbum);

		const videoId = traverseString(item, "playlistItemData", "videoId");

		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: album
					? {
							name: traverseString(album, "text"),
							albumId: traverseString(album, "browseId"),
						}
					: null,
				duration: null,
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		);
	}

	// =========================================
	// 💿 ALBUM SONG
	// =========================================
	public static parseAlbumSong(
		item: any,
		artistBasic: ArtistBasic,
		albumBasic: AlbumBasic,
		thumbnails: ThumbnailFull[],
	): SongDetailed | null {
		const title = traverseList(item, "flexColumns", "runs").find(isTitle);
		const duration = traverseList(item, "fixedColumns", "runs").find(
			isDuration,
		);

		const videoId = traverseString(item, "playlistItemData", "videoId");

		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: albumBasic,
				duration: Parser.parseDuration(duration?.text),
				thumbnails,
			},
			SongDetailed,
		);
	}

	// =========================================
	// 🏠 HOME
	// =========================================
	public static parseHomeSection(item: any) {
		return SongParser.parseSearchResult(item);
	}
}
