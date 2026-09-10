# Style guide

Rules for code and prose in this repo. Follow them unless you have a specific reason and say so.

## Code

Reads like one person wrote it across the whole project, not stitched from different generations.

- Match what is already there. Naming, brace style, error handling, file layout, import order. If the file uses `const x = () =>`, don't introduce `function x()`.
- No decorative comments. Comments explain a non-obvious decision or a gotcha, not what the line below does. A comment per line of code is the loudest tell there is.
- No TODOs left in committed code unless they have an owner or a tracking issue.
- Error handling does the right thing for the call site. Not a bare `catch (e) { console.error(e) }` tacked on because the linter wanted something. Handle it, rethrow it, or surface it to the user.
- No hallucinated APIs. If you're not sure a function exists, check. Don't invent method names to keep the line flowing.
- Don't over-abstract. One helper for one job. No `BaseManagerFactory` for a single call site.
- Commit messages say what and why in a line or two. Not "add user authentication" on a 500-line dump.
- Small commits. One logical change each.

## Prose (README, docs, commit bodies, PR text)

Plain and direct. Write it like you're describing the thing to someone who'll read it, not performing writing.

- No em dashes for dramatic pauses. Use a comma or split the sentence. An em dash now and then is fine; three per paragraph is a tell.
- No "It's not X, it's Y." reframe. Say the thing.
- No signposting. Don't open with "This section covers..." or close with "In summary...". Start at the point, stop when you've made it.
- No rule-of-three stacks. One example is usually enough. Three back-to-back tricolons reads machine-generated.
- No filler openers: "It's worth noting", "Importantly", "Notably", "Let's break this down", "Here's the thing".
- No inflation. Don't call things powerful, seamless, robust, modern, game-changing, or comprehensive. Describe what they do.
- No invented concept labels. Don't coin "the X paradox" / "X trap" / "X creep" to sound analytical.
- No vague authority. "Experts say" / "industry reports" with no source is filler. Name a source or drop the claim.
- No marketing voice. Don't sell. Describe.
- No bold-first bullets by default. A bullet is a sentence; bold a keyword only when you'd genuinely emphasize it speaking.
- Headings: sentence case, not Title Case Every Word. A "Where/What/Why" heading is a tell.
- Straight quotes, hyphen-minus arrows (`->`), not unicode `→`. Type it like you'd type it.
- First person is fine where it belongs (a note, a decision log). Don't switch "I" to "we" to sound formal.
- Vary sentence length. All short punchy fragments is as much a tell as all long clauses. Mix them.
- Don't repeat the same noun's synonyms in one paragraph (dashboard / interface / portal / hub). Pick one.
- Stop when the point is made. No tie-back ("So, to answer your question...") and no never-ending conclusion clause stack.

If you catch yourself reaching for a phrase because it sounds good, cut it and write the plain version.
