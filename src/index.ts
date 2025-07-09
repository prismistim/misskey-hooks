/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);

    if (!url.pathname.endsWith("/notify")) {
      return new Response("Not Found", { status: 404 });
    }

    if (
      request.headers.get("X-Misskey-Hook-Secret") !== env.MISSKEY_HOOK_SECRET
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const requestBody = await request.text();

    if (!requestBody) {
      return new Response("Bad Request", { status: 400 });
    }

    const body = JSON.parse(requestBody);

    try {
      const response = await fetch(env.DISCORD_HOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `**${body.type}**\n\n\`\`\`json\n)${JSON.stringify(
            body,
            null,
            2
          )}\n\`\`\``,
        }),
      });

      if (!response.ok) {
        return new Response("Failed to send message", { status: 500 });
      }
    } catch (e) {
      console.error("Error sending message to Discord:", e);
      return new Response("Internal Server Error", { status: 500 });
    }

    return new Response("ok");
  },
} satisfies ExportedHandler<Env>;
