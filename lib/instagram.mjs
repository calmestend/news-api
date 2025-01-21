import { gotScraping } from 'got-scraping';
import * as cheerio from "cheerio";

const getAppId = async (username) => {
	try {
		const res = await gotScraping({
			url: `https://www.instagram.com/${username}/`,
		})
		const $  = cheerio.load(res.body);
		const script = $('script:contains("CurrentUserInitialData")').html();
		const jsonString = script.match(/{.*}/)?.[0];
		const json = JSON.parse(jsonString);
		const jsonRequireData = json.require[0][3][0].__bbox.define;
		const jsonCurrentUserInitialData = jsonRequireData.find(item => item[0] === "CurrentUserInitialData")
		return jsonCurrentUserInitialData[2].APP_ID;
	} catch (error) {
		console.error({message: error.message})
	}
};

const getProfileData = async (username) => {
	try {
		const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
			headers: {
				"accept": "*/*",
				"priority": "u=1, i",
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"x-ig-app-id": await getAppId(username),
				"x-ig-www-claim": "0",
				"x-requested-with": "XMLHttpRequest", "Referrer-Policy": "strict-origin-when-cross-origin"
			},
			body: null,
			method: "GET"
		});
		const json = await res.json();
		return json;
	} catch (error) {
		console.error({message: error.message})
	}
};

const noticias = async (req, res) => {
	try {
		const username = 'transportemx';
		const json = await getProfileData(username);

		const extractedData = json.data.user.edge_owner_to_timeline_media.edges.map(edge => {
			const { id, dimensions, display_url, edge_media_to_caption, owner, thumbnail_src, is_video } = edge.node;

			return {
				id,
				dimensions,
				display_url,
				caption: edge_media_to_caption.edges.length > 0 
					? edge_media_to_caption.edges[0].node.text 
					: null,
				owner: {
					id: owner.id,
					username: owner.username,
				},
				thumbnail_src,
				is_video,
				video_url: is_video ? edge.node.video_url || null : null,
			};
		});

		const response = {
			data: {
				id: json.data.user.id,
				full_name: json.data.user.full_name,
				biography: json.data.user.biography,
				external_url: json.data.user.external_url,
				username: json.data.user.username,
				nodes: extractedData,
			},
		};

		res.json(response);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { noticias };
