const core = require("@actions/core");
const github = require("@actions/github");

function getQuery(path) {
  const context = github.context;
  const ghToken = core.getInput("gh-token");
  const octokit = github.getOctokit(ghToken);

  return await octokit.graphql(
    `
    {
      repository(name: $repo, owner: $owner) {
        object(expression: $expression) {
          id
          ... on Tree {
            id
            entries {
              type
              path
            }
          }
          ... on Blob {
            id
            text
          }
        }
      }
    }
    `,
    {
      ...context.repo,
      expression: `${context.sha}:${path}`,
    }
  );
}

function getBlobs(acc, { type, object, path }) {
  if (type === "blob") {
    acc.push({ type, object, path });
  }

  const {
    repository: {
      object: { entries },
    },
  } = getQuery(path);

  acc.concat(entries.reduce(getBlobs, acc));
}

async function run() {
  try {
    const srcDir = core.getInput("src-directory");

    const {
      repository: {
        object: { entries },
      },
    } = getQuery(srcDir);

    getBlobs({ type: "tree", entries }).map(({ path }) => {
      console.log(path);
      // read blob frontmatter
      // if meta tags set, skip.
      // if meta tags not set, read audio file and set meta tags.
    });

    console.log("Done.");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

// 1. Read Frontmatter.
// 2. If not already set, load audio file.
// 3. Calc metadata.
// 4. Create new commit with metadata added.

// {
//   repository(name: "gatsby-macc-netlify-cms", owner: "JWesorick") {
//     object(expression: "HEAD:src/pages/teachings") {
//       id
//       ... on Tree {
//         id
//         entries {
//           name
//           type
//           mode
//         }
//       }
//     }
//   }
// }
