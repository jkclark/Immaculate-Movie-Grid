const API_URL = "https://api.immaculatemoviegrid.com/dev";

export async function hitAPIGet(path: string): Promise<any> {
  return fetch(`${API_URL}/${path}`).then((response) => response.json());
}

export async function hitAPIPost(path: string, body: any): Promise<any> {
  return fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((response) => response.json());
}
