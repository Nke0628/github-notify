export const handler = async (event) => {
  try {
    // Step1 基本情報の抽出
    console.log("Received Event:", event);
    console.log("Event headers:", event.headers);
    console.log("Event body:", event.body);
    const body = event.body;
    const eventName = event.headers["X-GitHub-Event"];

    // Step2 バリデーション
    // Slack webhookのURL確認
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL is not set");
    }

    // イベント対象の確認
    if (
      eventName !== "push" &&
      !(eventName === "pull_request" && body.action === "opened")
    ) {
      throw new Error("This is not a valid event");
    }

    // Step3 Slackメッセージの構築
    let slackMessage = {};
    if (eventName === "push") {
      const repositoryName = body.repository.name;
      const branchName = body.ref.split("/").pop();
      const commitMessage = body.head_commit.message;

      // メインブランチへのpushのみ通知する
      const mainBranches = ["main", "master", "develop"];
      if (!mainBranches.includes(branchName)) {
        console.log(
          `Branch ${branchName} is not a main branch, skipping notification`
        );
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `Push branch ${branchName} skipped`,
          }),
        };
      }

      slackMessage = {
        attachments: [
          {
            color:
              branchName === "main" || branchName === "master"
                ? "good"
                : "warning",
            fields: [
              {
                title: `${repositoryName}にpushされました🚀`,
                value: `Branch:${branchName}\nBy: ${body.pusher.name}\nCommits: ${body.commits.length}\nCommitMessage: ${commitMessage}`,
                short: false,
              },
            ],
            footer: "GitHub",
            footer_icon:
              "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            ts: Math.floor(Date.now() / 1000),
            actions: [
              {
                type: "button",
                text: "View Repository",
                url: body.repository.html_url,
              },
            ],
          },
        ],
      };
    } else if (eventName === "pull_request") {
      const pullRequestUrl = body.pull_request.html_url;
      const repositoryName = body.pull_request.head.repo.name;
      const pullRequestTitle = body.pull_request.title;
      slackMessage = {
        attachments: [
          {
            color: "good",
            fields: [
              {
                title: `${repositoryName}にPullRequestが作成されました🌀`,
                value: `${pullRequestTitle}`,
                short: false,
              },
            ],
            footer: "GitHub",
            footer_icon:
              "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            ts: Math.floor(Date.now() / 1000),
            actions: [
              {
                type: "button",
                text: "View PullRequest",
                url: pullRequestUrl,
              },
            ],
          },
        ],
      };
    }

    // Step4 Slackに送信
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Webhook processed successfully",
      }),
    };
  } catch (error) {
    console.log("Error Processing webhook", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
    };
  }
};
