import { ArtistBasic, VideoDetailed, VideoFull } from "../types";
import checkType from "../utils/checkType";
import { isArtist, isDuration, isTitle } from "../utils/filters";
import { traverse, traverseList, traverseString } from "../utils/traverse";
import Parser from "./Parser";

export default class VideoParser {

	// =========================================
	// 🔥 VALIDATION HELPERS
	// =========================================
	private static isValidVideoId(id: any): boolean {
		return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);
	}

	// =========================================
	// 🎥 FULL VIDEO (player endpoint)
	// =========================================
	public static parse(data: any): VideoFull {
		const videoId = traverseString(data, "videoDetails", "videoId");

		if (!this.isValidVideoId(videoId)) {
			throw new Error(`Invalid videoId: ${videoId}`);
		}

		return {
			type: "VIDEO",
			videoId,
			name: traverseString(data, "videoDetails", "title"),
			artist: {
				artistId: traverseString(data, "videoDetails", "channelId"),
				name: traverseString(data, "author"),
			},
			duration: +traverseString(data, "videoDetails", "lengthSeconds"),
			thumbnails: traverseList(data, "videoDetails", "thumbnails"),
			unlisted: traverse(data, "unlisted"),
			familySafe: traverse(data, "familySafe"),
			paid: traverse(data, "paid"),
			tags: traverseList(data, "tags"),
		};
	}

	// =========================================
	// 🔍 SEARCH RESULT (CRÍTICO)
	// =========================================
	public static parseSearchResult(item: any): VideoDetailed | null {
		const columns = traverseList(item, "flexColumns", "runs").flat();

		const title = columns.find(isTitle);
		const artist = columns.find(isArtist) || columns[1];
		const duration = columns.find(isDuration);

		const videoId = traverseString(
			item,
			"playNavigationEndpoint",
			"videoId",
		);

		// 💣 FILTRO CRÍTICO (evita lixo no engine)
		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "VIDEO",
				videoId,
				name: traverseString(title, "text"),
				artist: {
					artistId: traverseString(artist, "browseId") || null,
					name: traverseString(artist, "text"),
				},
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
			},
			VideoDetailed,
		);
	}

	// =========================================
	// 👤 ARTIST TOP VIDEO
	// =========================================
	public static parseArtistTopVideo(
		item: any,
		artistBasic: ArtistBasic,
	): VideoDetailed | null {
		const videoId = traverseString(item, "videoId");

		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "VIDEO",
				videoId,
				name: traverseString(item, "runs", "text"),
				artist: artistBasic,
				duration: null,
				thumbnails: traverseList(item, "thumbnails"),
			},
			VideoDetailed,
		);
	}

	// =========================================
	// 📼 PLAYLIST VIDEO (MUITO FRÁGIL NA LIB ORIGINAL)
	// =========================================
	public static parsePlaylistVideo(item: any): VideoDetailed | null {
		const flexColumns = traverseList(item, "flexColumns", "runs").flat();
		const fixedColumns = traverseList(item, "fixedColumns", "runs").flat();

		const title = flexColumns.find(isTitle) || flexColumns[0];
		const artist = flexColumns.find(isArtist) || flexColumns[1];
		const duration = fixedColumns.find(isDuration);

		const videoId1: string = traverseString(
			item,
			"playNavigationEndpoint",
			"videoId",
		);

		// 🔥 fallback thumbnail (mantido mas seguro)
		const thumbUrl = traverseList(item, "thumbnails")?.[0]?.url;

		let videoId2: string | null = null;

		if (thumbUrl) {
			const match = thumbUrl.match(
				/https:\/\/i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]{11})\//,
			);
			if (match?.[1]) videoId2 = match[1];
		}

		const videoId = videoId1 || videoId2;

		// 💣 FILTRO FINAL
		if (!this.isValidVideoId(videoId)) return null;

		return checkType(
			{
				type: "VIDEO",
				videoId,
				name: traverseString(title, "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
			},
			VideoDetailed,
		);
	}
}
