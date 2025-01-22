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
const scrape = async (username) => {
	const response = await fetch("https://scraper-api.smartproxy.com/v2/scrape", {
		method: "POST",
		body: JSON.stringify({
			"target": "instagram_graphql_profile",
			"query": username
		}),
		headers: {
			"Content-Type": "application/json",
			"Authorization": ""
		},
	}).catch(error => console.log(error));

	const json = await response.json();
	return json;
}

const noticias = async (req, res) => {
	try {
		const username = 'transportemx';

		const json = await scrape(username);

		console.log(json.results[0].content.data.user);

		const extractedData = json.results[0].content.data.user.edge_owner_to_timeline_media.edges.map(edge => {
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
				id: json.results[0].content.data.user.id,
				full_name: json.results[0].content.data.user.full_name,
				biography: json.results[0].content.data.user.biography,
				external_url: json.results[0].content.data.user.external_url, 
				username: json.results[0].content.data.user.username,
				nodes: extractedData
			},
		};

		res.json(response);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { noticias };
