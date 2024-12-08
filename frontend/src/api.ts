const API_URL = "https://api.immaculatemoviegrid.com/dev";

export async function hitAPIGet(path: string): Promise<any> {
  return fetch(`${API_URL}/${path}`).then((response) => response.json());
}
