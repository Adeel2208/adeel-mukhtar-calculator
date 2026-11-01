# User Stories with Acceptance Criteria

**Product:** FairShare, a tip and bill splitter. Roles are in [app-roles.md](app-roles.md) and jobs are in [jobs-to-be-done.md](jobs-to-be-done.md).

## How to read this document

- **Story IDs** (S-1, S-2 …) are stable. **Acceptance criteria** are numbered `AC <story>.<n>` (for example AC 4.2) so tests can refer to them by name.
- **Serves** gives the job the story exists for. Every job belongs to a role.
- **Priority:** *Must*, *Should* and *Could* are planned for v1, in that order. *Later* is backlog.
- **Status** describes what the running app does today. All 13 stories are **Implemented**. Each was built in priority order, and every acceptance criterion was checked by automated tests in headless Chrome before work moved to the next story.
- Money is shown as US dollars with a `$` sign, thousands separators and exactly 2 decimals, for example `$1,234.50`. Messages in quotes are the exact text the user sees.
- Rules marked **[Rule …]** are defined once in [Shared rules](#shared-rules) at the end of this document and apply wherever they are cited.

## Story map

| Story | Title | Serves | Role | Priority | Status |
| :-- | :-- | :-- | :-- | :-- | :-- |
| S-1 | Split a bill evenly | J-1 | Bill Payer | Must | Implemented |
| S-2 | Choose a tip | J-2 | Bill Payer | Must | Implemented |
| S-3 | Get a clear message instead of a wrong result | J-1 | Bill Payer | Must | Implemented |
| S-4 | See shares that add up exactly to the total | J-1 | Bill Payer | Must | Implemented |
| S-5 | Compare tip levels | J-2 | Bill Payer | Should | Implemented |
| S-6 | Split by what each person ordered | J-3 | Itemizing Diner | Must | Implemented |
| S-7 | Split a shared item among only the people who had it | J-4 | Itemizing Diner | Must | Implemented |
| S-8 | Share tax and tip in proportion to each order | J-3 | Itemizing Diner | Must | Implemented |
| S-9 | Copy a breakdown to send to the group | J-5 | Bill Payer | Should | Implemented |
| S-10 | Start over, with undo | J-1 | Bill Payer | Could | Implemented |
| S-11 | Check items against the receipt | J-3 | Itemizing Diner | Later | Implemented |
| S-12 | Round shares up for cash | J-6 | Bill Payer | Later | Implemented |
| S-13 | Track who has paid | J-1 | Bill Payer | Later | Implemented |

---

## S-1 Split a bill evenly

**Serves:** J-1 (Bill Payer) · **Priority:** Must · **Status:** Implemented

> As a Bill Payer, I want to enter the bill and the number of people and see what each person owes, so that I know exactly how much to ask everyone for.

The *Split evenly* tab has four inputs: **Subtotal** (before tax and tip), **Tax** (an amount from the receipt), **Tip** (see S-2) and **Number of people** (a field with − and + buttons). The number of people includes the Bill Payer.

- **AC 1.1** Given I am on *Split evenly*, when I enter Subtotal `100.00`, Tax `8.00`, Tip 15% and Number of people `3`, then I see Subtotal `$100.00`, Tax `$8.00`, Tip (15%) `$15.00`, Total `$123.00` and "Each person pays $41.00".
- **AC 1.2** Given I have just opened the app, then *Split evenly* is selected, Subtotal and Tax are empty, Tip 15% is selected, Number of people is `2`, and the result area shows "Enter the bill subtotal to see the split." with no amounts.
- **AC 1.3** Given the result for AC 1.1 is showing, when I change Number of people to `4`, then without pressing any other button the result changes to "Each person pays $30.75".
- **AC 1.4** Given Subtotal `100.00`, Tax `8.00` and Tip 15%, when I set Number of people to `1`, then I see "1 person pays $123.00".
- **AC 1.5** Given the Tax field is empty, when I enter Subtotal `50.00`, Tip 0% and Number of people `2`, then Tax is treated as `$0.00` and I see Total `$50.00` and "Each person pays $25.00".
- **AC 1.6** Given Number of people is `1`, then the − button is disabled. Given it is `100`, then the + button is disabled. Pressing an enabled button changes the count by exactly 1 and updates the result.
- **AC 1.7** Given Number of people is `0`, then I see "Number of people must be at least 1." under the field, and the result area shows "Fix the highlighted fields to see the split." with no amounts. The page never shows "Infinity", "NaN" or a blank result.
- **AC 1.8** Given I type `2.5`, `abc` or `1e2` into Number of people, then I see "Number of people must be a whole number." Given I type `101`, then I see "Number of people can be at most 100." Given I clear the field, then I see "Enter the number of people." In each case no amounts are shown [Rule V-4].
- **AC 1.9** Given Subtotal `1000000.00`, Tax `1000000.00`, Tip `100`% (custom) and Number of people `7`, then I see Total `$3,000,000.00` and "6 people pay $428,571.43 · 1 person pays $428,571.42".

## S-2 Choose a tip

**Serves:** J-2 (Bill Payer) · **Priority:** Must · **Status:** Implemented

> As a Bill Payer, I want to pick a common tip percentage or type my own, so that the tip the group agreed is added without anyone doing the arithmetic.

Tip presets are **0%, 10%, 15%, 18% and 20%**, plus a **Custom %** field. The tip is calculated on the subtotal before tax [Rule C-2].

- **AC 2.1** Given Subtotal `80.00` and Tax empty, when I select the 20% preset, then I see Tip (20%) `$16.00` and Total `$96.00`.
- **AC 2.2** Given Subtotal `80.00`, when I type `12.5` in Custom %, then no preset is selected and I see Tip (12.5%) `$10.00` and Total `$90.00`.
- **AC 2.3** Given Custom % contains `12.5`, when I select the 18% preset, then the Custom % field is cleared and the tip uses 18%.
- **AC 2.4** Given Subtotal `100.00` and Tax `10.00`, when I select 20%, then Tip is `$20.00`, not `$22.00`, because tip is not charged on tax.
- **AC 2.5** Given Subtotal `10.05` and Tip 15%, then Tip is `$1.51` (1.5075 rounded half up). Given Subtotal `0.10` and Tip 15%, then Tip is `$0.02` (0.015 rounded half up) [Rule C-2].
- **AC 2.6** Given Subtotal `50.00`, when I type `100` in Custom %, then Tip is `$50.00`. When I type `0`, then Tip is `$0.00` and Total equals Subtotal plus Tax.
- **AC 2.7** Given I type `101` or `-5` in Custom %, then I see "Tip must be between 0% and 100%." Given I type `abc`, then I see "Enter a tip percentage, like 15." Given I type `12.555`, then I see "Use at most 2 decimal places." In each case no amounts are shown [Rule V-3].
- **AC 2.8** Given Custom % contains a value, when I clear the field, then the 0% preset becomes selected and the tip is `$0.00`.

## S-3 Get a clear message instead of a wrong result

**Serves:** J-1 (Bill Payer) · **Priority:** Must · **Status:** Implemented

> As a Bill Payer, I want a clear message whenever I enter something the app cannot use, so that I never send anyone an amount based on a typo.

This story covers how errors behave everywhere. The exact messages for each field are in [Rules V-1 to V-5](#input-rules).

- **AC 3.1** Given any input field, when I type a value that breaks a rule, then the message for that rule appears directly under the field as I type, the field is outlined as an error, and screen readers announce the message.
- **AC 3.2** Given a result is showing, when I change any field to an invalid value, then the result area immediately shows "Fix the highlighted fields to see the split." and **no** amounts, so an old result is never left on screen.
- **AC 3.3** Given a field is showing an error, when I correct it (for example Subtotal from `-20` to `20`), then the message and outline disappear and the correct result appears straight away. Nothing needs to be reloaded or cleared.
- **AC 3.4** Given Subtotal is `abc` and Number of people is `0`, then both fields show their own message at the same time.
- **AC 3.5** Given I paste text into a field instead of typing it, then it is checked by the same rules as typed text.
- **AC 3.6** Given I have not touched Subtotal yet, then it shows no error. The result area shows the prompt from AC 1.2. Given I click into Subtotal and leave it empty, then I see "Enter the bill subtotal."
- **AC 3.7** For every input listed in [Rule V-1](#input-rules), the app shows the stated message and never shows `NaN`, `Infinity`, `undefined`, a negative share, an empty page or a frozen page.

## S-4 See shares that add up exactly to the total

**Serves:** J-1 (Bill Payer) · **Priority:** Must · **Status:** Implemented

> As a Bill Payer, I want the shares to add up to the bill to the cent, so that I get back exactly what I paid, no more and no less.

Shares are worked out in whole cents. Leftover cents go one each to the first people in the list [Rule C-3].

- **AC 4.1** Given Subtotal `100.00`, Tax empty, Tip 0% and 3 people, then I see "1 person pays $33.34 · 2 people pay $33.33" and the note "Shares differ by $0.01 so they add up to exactly $100.00."
- **AC 4.2** Given the total divides evenly (for example AC 1.1), then no "Shares differ" note is shown.
- **AC 4.3** Given Subtotal `0.01`, Tip 0% and 3 people, then I see "1 person pays $0.01 · 2 people pay $0.00".
- **AC 4.4** Given Subtotal `1.00`, Tip 0% and 100 people, then I see "Each person pays $0.01". Given Subtotal `0.99`, then I see "99 people pay $0.01 · 1 person pays $0.00".
- **AC 4.5** Given Subtotal `0.10`, Tax `0.20` and Tip 0%, then Total shows `$0.30` exactly, with no floating-point error such as `0.30000000000000004`.
- **AC 4.6** For any valid input, the shares multiplied by the number of people who pay them add up exactly to the Total shown.
- **AC 4.7** When two share amounts are shown, the larger one is listed first.

## S-5 Compare tip levels

**Serves:** J-2 (Bill Payer) · **Priority:** Should · **Status:** Implemented

> As a Bill Payer, I want to see what 10%, 15%, 18% and 20% tips would cost side by side, so that the table can agree on a tip without working out each option.

The comparison table appears under the result on *Split evenly* only.

- **AC 5.1** Given Subtotal `60.00`, Tax empty and 2 people, then the table shows these rows:

  | Tip | Tip amount | Total | Per person |
  | :-- | :-- | :-- | :-- |
  | 10% | $6.00 | $66.00 | $33.00 |
  | 15% | $9.00 | $69.00 | $34.50 |
  | 18% | $10.80 | $70.80 | $35.40 |
  | 20% | $12.00 | $72.00 | $36.00 |

- **AC 5.2** Given the shares for a row are not equal (Subtotal `100.00`, 3 people, 10%), then that row's Per person shows the range `$36.66–$36.67`.
- **AC 5.3** Given the selected tip is one of the rows, then that row is highlighted. Given a custom tip such as 12.5% is selected, then an extra highlighted row for 12.5% is shown in order between 10% and 15%.
- **AC 5.4** Given the table is showing, when I select a row, then that tip becomes the selected tip and the main result updates to match.
- **AC 5.5** Given any field is invalid, then the table is hidden along with the result (AC 3.2).
- **AC 5.6** Given I am on *Split by item*, then the table is not shown.

## S-6 Split by what each person ordered

**Serves:** J-3 (Itemizing Diner) · **Priority:** Must · **Status:** Implemented

> As an Itemizing Diner, I want to list the people and the items on the receipt and say who had each item, so that each person pays for what they ordered.

The *Split by item* tab has a **People** list, an **Items** list (name, price and who had it), and the same Tax and Tip inputs as *Split evenly*. The subtotal is the sum of the item prices.

- **AC 6.1** Given I open *Split by item* for the first time, then the People list shows two people named "Person 1" and "Person 2", the Items list is empty, and the result area shows "Add an item to see the split."
- **AC 6.2** Given people Alice and Ben, Tax empty and Tip 0%, when I add item "Steak" `30.00` for Alice and item "Salad" `10.00` for Ben, then I see Alice `$30.00`, Ben `$10.00` and Total `$40.00`.
- **AC 6.3** Given I add a new item, then it is assigned to nobody, and the item shows "Choose who had this item." until I tick at least one person. The result area shows "Fix the highlighted fields to see the split." until then.
- **AC 6.4** Given a person's name is cleared, then I see "Enter a name." Given two people are named "Alice" and " alice ", then I see "Each person needs a different name." because names are compared without case and without surrounding spaces. Names are limited to 30 characters.
- **AC 6.5** Given an item price is empty, `abc`, negative, `0`, has 3 decimals or is above `1000000.00`, then I see the message from [Rule V-2](#input-rules) and no amounts.
- **AC 6.6** Given an item has no name, then it is shown as "Item *n*", where *n* is its position in the list.
- **AC 6.7** Given there is 1 person, then their Remove button is disabled. Given there are 20 people, then *Add person* is disabled and shows "You can add up to 20 people." Given there are 50 items, then *Add item* is disabled and shows "You can add up to 50 items."
- **AC 6.8** Given Alice is the only person ticked on "Steak", when I remove Alice, then "Steak" shows "Choose who had this item." and no amounts are shown until I assign it.
- **AC 6.9** Given a person has no items, then they are listed with `$0.00`.
- **AC 6.10** Given I rename Ben to "Benjamin", then the new name appears straight away in the item assignments and the result, and his amounts stay the same.
- **AC 6.11** Given I removed an item, then the result updates straight away without it.
- **AC 6.12** Given I have entered items on *Split by item*, when I switch to *Split evenly* and back, then my people and items are unchanged. Tax and Tip are shared by both tabs. The Subtotal and Number of people on *Split evenly* are kept separately.

## S-7 Split a shared item among only the people who had it

**Serves:** J-4 (Itemizing Diner) · **Priority:** Must · **Status:** Implemented

> As an Itemizing Diner, I want to mark an item as shared by some of the people at the table, so that its cost is split among only them.

- **AC 7.1** Given people Alice, Ben and Cara, when I add "Nachos" `12.00` and tick all three, then each person's items total includes `$4.00` for Nachos.
- **AC 7.2** Given "Nachos" `10.00` shared by Alice, Ben and Cara, then Alice gets `$3.34` and Ben and Cara get `$3.33` each. The leftover cent goes to whoever is first in the People list [Rule C-4].
- **AC 7.3** Given "Nachos" `10.00` shared by Alice and Ben only, then Alice and Ben each get `$5.00` and Cara gets nothing for Nachos.
- **AC 7.4** Given an item, when I press *Everyone* on it, then every person is ticked. When I then untick Cara, the item is split among the rest.
- **AC 7.5** Given "Mints" `0.01` shared by Alice, Ben and Cara, then Alice gets `$0.01` and Ben and Cara get `$0.00`.
- **AC 7.6** Given "Nachos" is shared by Alice only, when I untick Alice, then "Nachos" shows "Choose who had this item." (AC 6.3).

## S-8 Share tax and tip in proportion to each order

**Serves:** J-3 (Itemizing Diner) · **Priority:** Must · **Status:** Implemented

> As an Itemizing Diner, I want tax and tip shared in proportion to what each person ordered, so that I do not pay tax and tip on someone else's food.

On *Split by item*, the tip is the tip percentage of the items subtotal [Rule C-2]. Tax and tip are each shared in proportion to each person's items total [Rule C-5].

- **AC 8.1** Given Alice has "Steak" `30.00`, Ben has "Salad" `10.00`, Tax `4.00` and Tip 20%, then I see:

  | Person | Items | Tax | Tip | Total |
  | :-- | :-- | :-- | :-- | :-- |
  | Alice | $30.00 | $3.00 | $6.00 | $39.00 |
  | Ben | $10.00 | $1.00 | $2.00 | $13.00 |
  | **Total** | **$40.00** | **$4.00** | **$8.00** | **$52.00** |

- **AC 8.2** Given Alice, Ben and Cara each have items of `10.00`, Tax `1.00` and Tip 0%, then the tax is Alice `$0.34`, Ben `$0.33` and Cara `$0.33`, and the totals are `$10.34`, `$10.33` and `$10.33`.
- **AC 8.3** Given Alice has items of `10.00`, Ben has `20.00`, Tax `1.00` and Tip 0%, then the tax is Alice `$0.33` and Ben `$0.67`. The leftover cent goes to the person with the largest unrounded remainder, not simply the first person.
- **AC 8.4** Given a person has `$0.00` of items, then their tax and tip are `$0.00`.
- **AC 8.5** Given Tax `5.00` and no items, then the result area shows "Add an item to see the split." and no error or division by zero occurs.
- **AC 8.6** For any valid input, the Items, Tax, Tip and Total columns each add up exactly to the figures in the Total row.

## S-9 Copy a breakdown to send to the group

**Serves:** J-5 (Bill Payer) · **Priority:** Should · **Status:** Implemented

> As a Bill Payer, I want to copy a plain-text breakdown of the split, so that I can paste it into the group chat and everyone can check their amount.

- **AC 9.1** Given the result for AC 1.1 is showing, when I press *Copy breakdown*, then the clipboard contains exactly:

  ```
  Bill total: $123.00 (subtotal $100.00 + tax $8.00 + 15% tip $15.00)
  Split 3 ways: each person pays $41.00
  ```

- **AC 9.2** Given the result for AC 4.1 is showing, then the second line is `Split 3 ways: 1 person pays $33.34, 2 people pay $33.33`.
- **AC 9.3** Given the result for AC 8.1 is showing, then the clipboard contains exactly:

  ```
  Bill total: $52.00 (subtotal $40.00 + tax $4.00 + 20% tip $8.00)
  Alice: $39.00 (items $30.00 + tax $3.00 + tip $6.00)
  Ben: $13.00 (items $10.00 + tax $1.00 + tip $2.00)
  ```

- **AC 9.4** Given the copy worked, then the button reads "Copied" for 2 seconds and then goes back to *Copy breakdown*.
- **AC 9.5** Given no result is showing (prompt or error), then *Copy breakdown* is disabled.
- **AC 9.6** Given the browser blocks clipboard access, when I press *Copy breakdown*, then I see "Couldn't copy. Select the breakdown below and copy it yourself." and the breakdown text is shown on the page, already selected.

## S-10 Start over, with undo

**Serves:** J-1 (Bill Payer) · **Priority:** Could · **Status:** Implemented

> As a Bill Payer, I want to clear everything in one step and undo it if I slip, so that I can split the next bill without old numbers getting mixed in.

- **AC 10.1** Given I have entered values on either tab, when I press *Start over*, then both tabs go back to the starting state in AC 1.2 and AC 6.1, and I see "Bill cleared." with an *Undo* button.
- **AC 10.2** Given I pressed *Start over* less than 10 seconds ago, when I press *Undo*, then every field on both tabs and the result are exactly as they were before.
- **AC 10.3** Given 10 seconds have passed since *Start over*, then the *Undo* button is gone.
- **AC 10.4** Given the app is already in its starting state, then *Start over* is disabled.

## S-11 Check items against the receipt

**Serves:** J-3 (Itemizing Diner) · **Priority:** Later · **Status:** Implemented

> As an Itemizing Diner, I want to compare the items I entered with the subtotal printed on the receipt, so that I notice a missed or mistyped item before anyone pays.

- **AC 11.1** Given items adding up to `38.00` and Receipt subtotal `40.00`, then I see "Your items add up to $38.00, which is $2.00 less than the receipt subtotal of $40.00." The split is still shown.
- **AC 11.2** Given items adding up to `42.00` and Receipt subtotal `40.00`, then I see "Your items add up to $42.00, which is $2.00 more than the receipt subtotal of $40.00."
- **AC 11.3** Given the two are equal, then I see "Your items match the receipt subtotal."
- **AC 11.4** Given Receipt subtotal is empty, then no comparison is shown. Given it is invalid, then it shows the same message the Subtotal field would show under Rule V-1 (for example, `0` shows "Subtotal must be more than 0."), and no amounts are shown until it is fixed or cleared.

## S-12 Round shares up for cash

**Serves:** J-6 (Bill Payer) · **Priority:** Later · **Status:** Implemented

> As a Bill Payer, I want to round every share up to a whole dollar, so that people can pay me in notes without small change.

The option is a checkbox on *Split evenly*.

- **AC 12.1** Given Subtotal `100.00`, Tip 0%, 3 people and *Round shares up to whole dollars* ticked, then I see "Each person pays $34.00" and "The extra $2.00 is added to the tip.", and Tip (0% + rounding) and Total update to `$2.00` and `$102.00`. When I untick it, the result goes back to AC 4.1.
- **AC 12.2** Given the shares are already whole dollars, then nothing changes and no note is shown.

## S-13 Track who has paid

**Serves:** J-1 (Bill Payer) · **Priority:** Later · **Status:** Implemented

> As a Bill Payer, I want to tick people off as they pay me back, so that I know how much I am still owed.

The list is in a *Track who has paid* section under the result on *Split evenly*. It shows Person 1, Person 2 and so on, each with their share.

- **AC 13.1** Given 3 people each owing `$41.00`, when I tick Person 1 and Person 2 as paid, then I see "Still to collect: $41.00".
- **AC 13.2** Given everyone is ticked, then I see "Everyone has paid."
- **AC 13.3** Given I change any input that changes the shares, then all ticks are cleared and I see "Amounts changed, so paid ticks were cleared."

---

## Shared rules

### Input rules

Each field is checked against these rules in the order listed, and only the first rule it breaks is shown. Spaces before and after a value are ignored. Values such as `12.` (read as 12.00) and `.5` (read as 0.50) are accepted.

**Rule V-1: Bill amounts (Subtotal and Tax)**

| Input example | Subtotal message | Tax message |
| :-- | :-- | :-- |
| empty | "Enter the bill subtotal." (only after the field has been used, see AC 3.6) | none: treated as 0.00 |
| `-20` | "Amount can't be negative." | "Amount can't be negative." |
| `abc`, `1,000`, `1e3`, `$5`, `1.2.3` | "Enter a number, like 42.50." | "Enter a number, like 42.50." |
| `12.345` | "Use at most 2 decimal places." | "Use at most 2 decimal places." |
| `0` | "Subtotal must be more than 0." | none: 0 is valid |
| `1000000.01` | "Enter an amount up to 1,000,000.00." | "Enter an amount up to 1,000,000.00." |

**Rule V-2: Item price.** The same as Subtotal, except that an empty price shows "Enter a price." and `0` shows "Price must be more than 0."

**Rule V-3: Custom tip %.** Empty selects 0% (AC 2.8). `abc` shows "Enter a tip percentage, like 15." Below 0 or above 100 shows "Tip must be between 0% and 100%." More than 2 decimals shows "Use at most 2 decimal places."

**Rule V-4: Number of people.** Empty shows "Enter the number of people." `2.5`, `abc` or `1e2` shows "Number of people must be a whole number." Below 1 shows "Number of people must be at least 1." Above 100 shows "Number of people can be at most 100."

**Rule V-5: Item mode.** A person's name must not be empty, must be different from the others, and is at most 30 characters. Each item needs at least one person. There can be 1 to 20 people and up to 50 items.

### Result area messages

| State | Message |
| :-- | :-- |
| Subtotal not entered yet (*Split evenly*) | "Enter the bill subtotal to see the split." |
| No items yet (*Split by item*) | "Add an item to see the split." |
| Any field is invalid | "Fix the highlighted fields to see the split." |

In all three states no amounts are shown.

### Calculation rules

- **Rule C-1: Whole cents.** All money is stored and calculated as whole cents (integers), never as floating-point dollars.
- **Rule C-2: Tip.** Tip = subtotal × tip% and is rounded half up to the cent. Tip is calculated on the subtotal before tax. To avoid floating-point error, use tip_cents = round_half_up(subtotal_cents × tip_hundredths_of_a_percent / 10,000). Total = subtotal + tax + tip.
- **Rule C-3: Even split.** For a total of T cents and n people: base = floor(T / n) and r = T − base × n. The first r people pay base + 1 cent and the rest pay base.
- **Rule C-4: Shared item.** An item's price is split evenly among the people ticked on it, using Rule C-3. Leftover cents go to the ticked people in the order they appear in the People list.
- **Rule C-5: Proportional tax and tip.** Tax and tip are each split by the largest-remainder method: each person's exact share = amount × (their items ÷ all items). Everyone first gets their share rounded down to the cent. The leftover cents then go one each to the people with the largest remainders. Ties go to whoever is earlier in the People list.
- **Invariant:** For every valid input, the shares add up exactly to the Total.

---

## Non-functional requirements

These apply to every story marked Implemented.

| ID | Requirement | How it is checked |
| :-- | :-- | :-- |
| N-1 | Works in current versions of Chrome, Edge, Firefox and Safari. | Manual check of AC 1.1, 6.2 and 8.1 in each browser. |
| N-2 | Runs on the reviewer's computer by following the README, with no accounts, API keys, cloud services or network calls. Bill data never leaves the device. | Clean-machine install. The network tab shows no requests after the page loads. |
| N-3 | Usable from 320 px to 1440 px wide with no horizontal scrolling. Touch targets are at least 44 × 44 px. | Responsive check at 320, 768 and 1440 px. |
| N-4 | Every control can be reached and used with the keyboard, in a logical order, with a visible focus outline. | Keyboard-only run of AC 1.1 and AC 6.2. |
| N-5 | Every input has a label. Error messages are linked to their field and announced. The result area is a polite live region. | Screen reader check (NVDA or VoiceOver). |
| N-6 | Text and controls meet WCAG 2.1 AA contrast. | Contrast checker. |
| N-7 | The result updates within 100 ms of any change, with up to 20 people and 50 items. | Timing measured in browser dev tools. |
| N-8 | Number fields bring up a numeric keypad on phones (`inputmode="decimal"` or `"numeric"`). | Check on a phone or in device emulation. |

---

## Assumptions

Copy these into the README.

1. There is one currency, shown as US dollars with 2 decimal places. Input uses a dot for decimals and no thousands separators. Showing several currencies is out of scope.
2. Tax is entered as the amount printed on the receipt, not as a rate.
3. The tip is calculated on the subtotal before tax, which is the usual US practice.
4. The number of people on *Split evenly* includes the Bill Payer.
5. The limits are: amounts up to 1,000,000.00, 1 to 100 people on *Split evenly*, 1 to 20 people and up to 50 items on *Split by item*, and tips from 0% to 100%. These cover any realistic restaurant bill and keep every value well within safe integer range.
6. Leftover cents go to people in list order, so "Person 1" or the first person listed may pay 1 cent more. This is stated on screen (AC 4.1).
7. Service charges, discounts, coupons, scanning photos of receipts, payment links and saving bills between visits are out of scope.

## Traceability

| Role | Job | Stories |
| :-- | :-- | :-- |
| R-1 Bill Payer | J-1 Get my money back exactly | S-1, S-3, S-4, S-10, S-13 |
| R-1 Bill Payer | J-2 Agree on a tip quickly | S-2, S-5 |
| R-1 Bill Payer | J-5 Ask for money in a way people trust | S-9 |
| R-1 Bill Payer | J-6 Collect cash without small change | S-12 |
| R-2 Itemizing Diner | J-3 Pay for what I ordered | S-6, S-8, S-11 |
| R-2 Itemizing Diner | J-4 Split shared dishes among the people who ate them | S-7 |
