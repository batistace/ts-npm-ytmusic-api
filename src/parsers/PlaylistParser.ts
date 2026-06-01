import { ArtistBasic, PlaylistDetailed, PlaylistFull } from "../types";
import checkType from "../utils/checkType";
import { isArtist } from "../utils/filters";
import { traverse, traverseList, traverseString } from "../utils/traverse";

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		const artist = traverse(data, "tabs", "straplineTextOne");

		const rawVideoCount =
			traverseList(data, "tabs", "secondSubtitle", "text") || [];

		const videoCountText = rawVideoCount?.at?.(2);

		const videoCount = (() => {
			try {
				if (!videoCountText) return null;

				const number = videoCountText
					.split(" ")
					?.at?.(0)
					?.replaceAll(",", "");

				if (!number || isNaN(Number(number))) return null;

				return Number(number);
			} catch {
				return null;
			}
		})();

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: playlistId || "",
				name:
					traverseString(data, "tabs", "title", "text") ||
					"Unknown Playlist",
				artist: {
					name: traverseString(artist, "text") || "Unknown Artist",
					artistId: traverseString(artist, "browseId") || null,
				},
				videoCount,
				thumbnails: traverseList(data, "tabs", "thumbnails") || [],
			},
			PlaylistFull,
		);
	}

	public static parseSearchResult(item: any): PlaylistDetailed {
		const columns = (traverseList(item, "flexColumns", "runs") || []).flat();

		const title = columns?.[0];
		const artist = columns.find(isArtist) || columns?.[3];

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId") || "",
				name: traverseString(title, "text") || "Unknown Playlist",
				artist: {
					name: traverseString(artist, "text") || "Unknown Artist",
					artistId: traverseString(artist, "browseId") || null,
				},
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			PlaylistDetailed,
		);
	}

	public static parseArtistFeaturedOn(
		item: any,
		artistBasic: ArtistBasic,
	): PlaylistDetailed {
		return checkType(
			{
				type: "PLAYLIST",
				playlistId:
					traverseString(item, "navigationEndpoint", "browseId") || "",
				name: traverseString(item, "runs", "text") || "Unknown Playlist",
				artist: artistBasic,
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			PlaylistDetailed,
		);
	}

	public static parseHomeSection(item: any): PlaylistDetailed {
		const artist = traverse(item, "subtitle", "runs");

		return checkType(
			{
				type: "PLAYLIST",
				playlistId:
					traverseString(item, "navigationEndpoint", "playlistId") || "",
				name: traverseString(item, "runs", "text") || "Unknown Playlist",
				artist: {
					name: traverseString(artist, "text") || "Unknown Artist",
					artistId: traverseString(artist, "browseId") || null,
				},
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			PlaylistDetailed,
		);
	}
}
