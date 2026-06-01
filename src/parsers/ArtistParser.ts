import { ArtistDetailed, ArtistFull } from "../types";
import checkType from "../utils/checkType";
import { traverseList, traverseString } from "../utils/traverse";
import AlbumParser from "./AlbumParser";
import PlaylistParser from "./PlaylistParser";
import SongParser from "./SongParser";
import VideoParser from "./VideoParser";

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artistBasic = {
			artistId: artistId || "",
			name: traverseString(data, "header", "title", "text") || "Unknown Artist",
		};

		const thumbnails = traverseList(data, "header", "thumbnails") || [];

		const rawTopSongs = traverseList(data, "musicShelfRenderer", "contents") || [];

		const topSongs = rawTopSongs
			.map((item) => {
				try {
					const song = SongParser.parseArtistTopSong(item, artistBasic);

					// 🔥 FILTRO CRÍTICO (evita lixo vindo da lib)
					if (!song?.videoId || typeof song.videoId !== "string") return null;
					if (song.videoId.length !== 11) return null;

					return song;
				} catch {
					return null;
				}
			})
			.filter(Boolean);

		const carousels = traverseList(data, "musicCarouselShelfRenderer") || [];

		const topAlbums =
			(carousels?.[0]?.contents || [])
				.map((item: any) => {
					try {
						return AlbumParser.parseArtistTopAlbum(item, artistBasic);
					} catch {
						return null;
					}
				})
				.filter(Boolean) || [];

		const topSingles =
			(carousels?.[1]?.contents || [])
				.map((item: any) => {
					try {
						return AlbumParser.parseArtistTopAlbum(item, artistBasic);
					} catch {
						return null;
					}
				})
				.filter(Boolean) || [];

		const topVideos =
			(carousels?.[2]?.contents || [])
				.map((item: any) => {
					try {
						return VideoParser.parseArtistTopVideo(item, artistBasic);
					} catch {
						return null;
					}
				})
				.filter(Boolean) || [];

		const featuredOn =
			(carousels?.[3]?.contents || [])
				.map((item: any) => {
					try {
						return PlaylistParser.parseArtistFeaturedOn(item, artistBasic);
					} catch {
						return null;
					}
				})
				.filter(Boolean) || [];

		const similarArtists =
			(carousels?.[4]?.contents || [])
				.map((item: any) => this.parseSimilarArtists(item))
				.filter(Boolean) || [];

		return checkType(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails,
				topSongs,
				topAlbums,
				topSingles,
				topVideos,
				featuredOn,
				similarArtists,
			},
			ArtistFull,
		);
	}

	public static parseSearchResult(item: any): ArtistDetailed {
		const columns = (traverseList(item, "flexColumns", "runs") || []).flat();

		const title = columns?.[0];

		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId") || "",
				name: traverseString(title, "text") || "Unknown Artist",
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			ArtistDetailed,
		);
	}

	public static parseSimilarArtists(item: any): ArtistDetailed {
		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId") || "",
				name: traverseString(item, "runs", "text") || "Unknown Artist",
				thumbnails: traverseList(item, "thumbnails") || [],
			},
			ArtistDetailed,
		);
	}
}
