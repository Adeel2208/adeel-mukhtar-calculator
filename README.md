# FairShare: tip and bill splitter

FairShare works out what each person owes after a shared meal. It splits a bill evenly or by what each person ordered, adds tax and tip, and makes sure the shares add up to the bill exactly, to the cent.

**Who it is for**
- **Bill Payer:** paid the whole bill on one card and needs to collect from everyone, fast.
- **Itemizing Diner:** ordered differently from the others and wants to pay only for their own food, plus a fair part of the tax and tip.

**Why a bill splitter:** these users are easy to picture, splitting a bill is a common task, and the money has to be exactly right. That gives every acceptance criterion a clear right and wrong answer, including the hard cases: leftover cents, zero people, empty bills and very large amounts.

The product documents are in [docs/](docs/): [App Roles](docs/app-roles.md), [Jobs To Be Done](docs/jobs-to-be-done.md) and [User Stories with Acceptance Criteria](docs/user-stories.md). All 13 stories are implemented.

**Live app:** https://adeel2208.github.io/adeel-mukhtar-calculator/ is the same code as this repository, served by GitHub Pages. You can also run it on your own computer, as described below.

## Run it

**Prerequisites:** a current version of Chrome, Edge, Firefox or Safari. Nothing else is needed: no Node.js, no install step, no accounts and no network.

There is nothing to install. Get the code and open the page:

```sh
git clone <repository-url>
cd <repository-folder>

# then open the page in your default browser:
start src\index.html        # Windows
open src/index.html         # macOS
xdg-open src/index.html     # Linux
```

You can also double-click `src/index.html`, or drag it into a browser window.

The app is plain HTML, CSS and JavaScript with no dependencies or build step.

## Project layout

| Path | What it holds |
| :-- | :-- |
| `src/calc.js` | All calculation and validation rules. Pure functions on whole cents, with no screen code. |
| `src/app.js` | Screen logic: state, input checks, drawing the result. |
| `src/index.html`, `src/styles.css` | Page and styles. |
| `docs/` | Roles, jobs and user stories. |
| `transcripts/` | The AI session transcript. |
| `index.html`, `.nojekyll` | Used only by the live GitHub Pages site. `index.html` forwards to `src/`. |

## Tests

The stories were built one at a time in priority order (Must, Should, Could, Later). For each one, automated tests were written first for every acceptance criterion: logic tests with Node's built-in runner, and browser tests that drove headless Chrome. Work moved to the next story only after they all passed. At the end, 89 tests passed against the finished app.

At the product owner's request, each story's tests were removed from the repository once the story was complete, so no test suite ships with this package. To check the behaviour, follow the acceptance criteria in [docs/user-stories.md](docs/user-stories.md) by hand. Each one gives exact inputs and the exact text you should see.

## AI tool and model

- **Tool:** Claude Code (VS Code extension)
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)

## Session transcript

[transcripts/session-01.md](transcripts/session-01.md) is the full Claude Code session for this submission, exported with `/export` and unedited. It covers the spec, the build, the verification and the publishing.

Before this session, I made an earlier attempt at the same brief in separate sessions, in a different codebase that is not part of this submission. The only thing reused from it was the headless-browser test helper, which was adapted to run the tests during this session. It is not in this repository.

## Code changed by hand

None. All code was written by the AI tool.

## Assumptions

1. There is one currency, shown as US dollars with 2 decimal places. Input uses a dot for decimals and no thousands separators.
2. Tax is entered as the amount printed on the receipt, not as a rate.
3. The tip is calculated on the subtotal before tax.
4. On *Split evenly*, the number of people includes the Bill Payer.
5. The limits are: amounts up to $1,000,000.00, 1 to 100 people on *Split evenly*, 1 to 20 people and up to 50 items on *Split by item*, and tips from 0% to 100%.
6. Leftover cents go to people in list order, so the first person may pay 1 cent more. The app says so on screen.
7. *Round shares up* (S-12) and *Track who has paid* (S-13) are on *Split evenly* only.
8. Service charges, discounts, scanning photos of receipts, payment links and saving bills between visits are out of scope.
