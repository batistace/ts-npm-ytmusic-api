import { PageType } from "../constants";
import { AlbumDetailed, HomeSection } from "../types";
import checkType from "../utils/checkType";
import { traverseList, traverseString } from "../utils/traverse";
import AlbumParser from "./AlbumParser";
import PlaylistParser from "./PlaylistParser";
import SongParser from "./SongParser";

export default class Parser {
	public static parseDuration(time: string) {
		if (!time || typeof time !== "string") return null;

		const parts = time
			.split(":")
			.reverse()
			.map(n => Number(n));

		if (parts.some(isNaN)) return null;

		const [seconds = 0, minutes = 0, hours = 0] = parts;

		return seconds + minutes * 60 + hours * 3600;
	}

	public static parseNumber(value: string): number {
		if (!value || typeof value !== "string") return NaN;

		const lastChar = value.at(-1);
		const number = Number(value.slice(0, -1));

		if (!lastChar || isNaN(number)) return NaN;

		if (!lastChar.match(/^[A-Z]$/)) {
			return Number(value);
		}

		return (
			{
				K: number * 1_000,
				M: number * 1_000_000,
				B: number * 1_000_000_000,
				T: number * 1_000_000_000_000,
			}[lastChar] || NaN
		);
	}

	public static parseHomeSection(data: any): HomeSection {
		const pageType =
			traverseString(
				data,
				"contents",
				"title",
				"browseEndpoint",
				"pageType",
			) || "";

		const playlistId =
			traverseString(
				data,
				"navigationEndpoint",
				"watchPlaylistEndpoint",
				"playlistId",
			) || null;

		const rawContents = traverseList(data, "contents") || [];

		const contents = rawContents
			.map(item => {
				try {
					switch (pageType) {
						case PageType.MUSIC_PAGE_TYPE_ALBUM:
							return AlbumParser.parseHomeSection(item);

						case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
							return PlaylistParser.parseHomeSection(item);

						default:
							if (playlistId) {
								return PlaylistParser.parseHomeSection(item);
							}
							return SongParser.parseHomeSection(item);
					}
				} catch {
					return null;
				}
			})
			.filter(Boolean);

		return checkType(
			{
				title:
					traverseString(data, "header", "title", "text") ||
					"Unknown Section",
				contents,
			},
			HomeSection,
		);
	}
}
