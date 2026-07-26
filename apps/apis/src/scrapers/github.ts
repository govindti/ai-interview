import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { config } from "../config";
import { ExternalServiceError } from "../lib/errors";

const httpsAgent = config.PROXY_URL ? new HttpsProxyAgent(config.PROXY_URL) : undefined;

export async function scrapeGithub(username: string) {
  try {
    const userRepos = await axios.request({
      url: `https://api.github.com/users/${username}/repos`,
      httpsAgent,
    });

    return userRepos.data.map((x: any) => ({
      description: x.description,
      name: x.name,
      fullName: x.full_name,
      starCount: x.stargazers_count,
    }));
  } catch (err) {
    throw new ExternalServiceError("GitHub", `Failed to fetch repos for ${username}`);
  }
}
