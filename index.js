require("dotenv").config();

const Snoowrap = require("snoowrap");
const Snoostorm = require("snoostorm");
const axios = require("axios");
const request = require("request");
const HTMLParser = require("node-html-parser");

const r = new Snoowrap({
  userAgent: "node:boulderinginstabot:v1.0",
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
});

const client = new Snoostorm(r);

const streamOpts = {
  subreddit: "boulderinginstabot",
  results: 1
};

const submissions = client.SubmissionStream(streamOpts);

submissions.on("submission", submission => {
  if (submission.domain === "instagram.com") {
    console.log("working");
    const url = submission.url;
    const id = submission.id;
    const html = submission.media.oembed.html;
    if (html.indexOf("iframe") !== -1) {
      const src = html.match(/src\=([^\s]*)\s/)[0];
      let uri = src.match(/"((?:\\.|[^"\\])*)"/)[0];
      uri = decodeURIComponent(uri).replace(/"/g, "");
      const streamableEmail = process.env.STREAMABLE_EMAIL;
      const streamablePass = process.env.STREAMABLE_PASSWORD;
      const streamableUrl =
        "https://api.streamable.com/import?url=" + encodeURIComponent(uri);
      axios({
        method: "get",
        url: streamableUrl,
        headers: { "User-Agent": "Bouldering Insta Bot v1.0" },
        auth: {
          username: streamableEmail,
          password: streamablePass
        }
      })
        .then(response => {
          if (response.data.shortcode) {
            const shortcode = response.data.shortcode;
            const replyUrl = "https://streamable.com/" + shortcode;
            const replyString = `This is an automated message, your video has been uploaded to streamable to provide a better desktop experience. ${replyUrl}`;
            r.getSubmission(id).reply(replyString);
          }
        })
        .catch(error => console.log(error));
    }
  }
});
