import { SearchResult } from "../types";
import { traverseList } from "../utils/traverse";
import AlbumParser from "./AlbumParser";
import ArtistParser from "./ArtistParser";
import PlaylistParser from "./PlaylistParser";
import SongParser from "./SongParser";
import VideoParser from "./VideoParser";

export default class SearchParser {
	public static parse(item: any): SearchResult | null {
		try {
			const flexColumns = traverseList(item, "flexColumns") || [];

			const rawType = traverseList(
				flexColumns?.[1],
				"runs",
				"text",
			)?.at?.(0);

			if (!rawType || typeof rawType !== "string") return null;

			const type = rawType as
				| "Song"
				| "Video"
				| "Artist"
				| "EP"
				| "Single"
				| "Album"
				| "Playlist";

			const parsers: Record<string, (item: any) => any> = {
				Song: SongParser.parseSearchResult,
				Video: VideoParser.parseSearchResult,
				Artist: ArtistParser.parseSearchResult,
				EP: AlbumParser.parseSearchResult,
				Single: AlbumParser.parseSearchResult,
				Album: AlbumParser.parseSearchResult,
				Playlist: PlaylistParser.parseSearchResult,
			};

			const parser = parsers[type];

			if (!parser) return null;

			const result = parser(item);

			// 🔥 CRÍTICO: bloqueia lixo (evita seu bug de videoId vazio vazar)
			if (result?.type === "SONG") {
				if (!result.videoId || result.videoId.length !== 11) {
					return null;
				}
			}

			return result || null;
		} catch {
			return null;
		}
	}
}
