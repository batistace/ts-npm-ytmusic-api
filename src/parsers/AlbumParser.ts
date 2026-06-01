import { AlbumBasic, AlbumDetailed, AlbumFull, ArtistBasic } from "../types";
import checkType from "../utils/checkType";
import { isArtist } from "../utils/filters";
import { traverse, traverseList, traverseString } from "../utils/traverse";
import SongParser from "./SongParser";

export default class AlbumParser {
	public static parse(data: any, albumId: string): AlbumFull {
		const albumBasic: AlbumBasic = {
			albumId: albumId || "",
			name: traverseString(data, "tabs", "title", "text") || "Unknown Album",
		};

		const artistData = traverseList(data, "tabs", "straplineTextOne", "runs") || [];

		const artistBasic: ArtistBasic = {
			artistId: traverseString(artistData, "browseId") || null,
			name: traverseString(artistData, "text") || "Unknown Artist",
		};

		const thumbnails = traverseList(data, "background", "thumbnails") || [];

		const rawSongs = traverseList(data, "musicResponsiveListItemRenderer") || [];

		const songs = rawSongs
			.map((item) => {
				try {
					const parsed = SongParser.parseAlbumSong(
						item,
						artistBasic,
						albumBasic,
						thumbnails,
					);

					// 🔥 CRÍTICO: bloqueia lixo (resolve seu bug do videoId vazio)
					if (!parsed?.videoId || typeof parsed.videoId !== "string") {
						return null;
					}

					if (parsed.videoId.length !== 11) {
						return null;
					}

					return parsed;
				} catch {
					return null;
				}
			})
			.filter(Boolean);

		return checkType(
			{
				type: "ALBUM",
				...albumBasic,
				playlistId: traverseString(data, "musicPlayButtonRenderer", "playlistId") || null,
				artist: artistBasic,
				year: AlbumParser.processYear(
					traverseList(data, "tabs", "subtitle", "text")?.at?.(-1),
				),
				thumbnails,
				songs,
			},
			AlbumFull,
		);
	}

	public static parseSearchResult(item: any): AlbumDetailed {
		const columns = (traverseList(item, "flexColumns", "runs") || []).flat();

		const title = columns[0];
		const artist = columns.find(isArtist) || columns[3];

		const playlistId =
			traverseString(item, "overlay", "playlistId") ||
			traverseString(item, "thumbnailOverlay", "playlistId") ||
			null;

		const browseIds = traverseList(item, "browseId") || [];
		const albumId = browseIds.length ? browseIds.at(-1) : "";

		return checkType(
			{
				type: "ALBUM",
				albumId,
				playlistId,
				artist: {
					name: traverseString(artist, "text") || "Unknown Artist",
					artistId: traverseString(artist, "browseId") || null,
				},
				year: AlbumParser.processYear(columns.at(-1)?.text),
				name: traverseString(title, "text") || "Unknown Album",
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			AlbumDetailed,
		);
	}

	public static parseArtistAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType(
			{
				type: "ALBUM",
				albumId: traverseList(item, "browseId")?.at?.(-1) || "",
				playlistId: traverseString(item, "thumbnailOverlay", "playlistId") || null,
				name: traverseString(item, "title", "text") || "Unknown Album",
				artist: artistBasic,
				year: AlbumParser.processYear(
					traverseList(item, "subtitle", "text")?.at?.(-1),
				),
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			AlbumDetailed,
		);
	}

	public static parseArtistTopAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType(
			{
				type: "ALBUM",
				albumId: traverseList(item, "browseId")?.at?.(-1) || "",
				playlistId: traverseString(item, "musicPlayButtonRenderer", "playlistId") || null,
				name: traverseString(item, "title", "text") || "Unknown Album",
				artist: artistBasic,
				year: AlbumParser.processYear(
					traverseList(item, "subtitle", "text")?.at?.(-1),
				),
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			AlbumDetailed,
		);
	}

	public static parseHomeSection(item: any): AlbumDetailed {
		const artist = traverse(item, "subtitle", "runs")?.at?.(-1);

		return checkType(
			{
				type: "ALBUM",
				albumId: traverseString(item, "title", "browseId") || "",
				playlistId: traverseString(item, "thumbnailOverlay", "playlistId") || null,
				name: traverseString(item, "title", "text") || "Unknown Album",
				artist: {
					name: traverseString(artist, "text") || "Unknown Artist",
					artistId: traverseString(artist, "browseId") || null,
				},
				year: null,
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			AlbumDetailed,
		);
	}

	private static processYear(year: string) {
		return year && typeof year === "string" && year.match(/^\d{4}$/)
			? Number(year)
			: null;
	}
}
