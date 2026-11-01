# App Roles

**Product:** FairShare, a tip and bill splitter that runs in the browser.

FairShare works out what each person at a table owes after a shared meal. It can split the bill evenly or by what each person ordered, adds tax and tip, and makes sure the shares add up to the bill to the cent.

A bill splitter was chosen because the people who use one are easy to picture, the job is common, and the money has to be exactly right. That gives the acceptance criteria clear right and wrong answers, including the hard cases: rounding leftover cents, zero people, empty bills and very large amounts.

There are two roles. Both use the same screen on their own device, and the app has no accounts. What separates them is how much detail they need: the Bill Payer wants a fast, even split, and the Itemizing Diner wants each person to pay for what they ordered.

---

## R-1 Bill Payer

A **Bill Payer** is the person who pays the whole bill for a group, usually friends, family or colleagues, on one card, and then has to collect the money back from everyone else. They are often at the table or just leaving, working on their phone, and want an answer in a few seconds. In most cases everyone ate about the same, so an even split is fair enough.

They can enter the bill subtotal, the tax from the receipt, a tip percentage and the number of people, and see the total and what each person owes. They can compare what different tips would cost, copy a breakdown to send to the group, and start again for a new bill.

They must never be shown shares that add up to more or less than the bill total, and must never be shown an amount calculated from input the app could not understand.

## R-2 Itemizing Diner

An **Itemizing Diner** is someone in a group where people ordered very different amounts. For example, one person had a steak and wine and another had only a salad, or a dish was shared by only part of the table. They are often the one who ordered less, or the person trying to keep things fair, and they will not accept an even split.

They can list the people at the table, enter each item from the receipt with its price, and say who had it, including items shared by some or all of the group. They can see each person's total broken down into items, tax and tip, with tax and tip shared in proportion to what each person ordered.

They must never be charged for an item they did not have, and must never pay tax or tip on someone else's items.

---

### How the roles differ

| | Bill Payer (R-1) | Itemizing Diner (R-2) |
| :-- | :-- | :-- |
| Main concern | Speed. Getting their money back | Fairness. Paying only for what they had |
| Input they will tolerate | 3 to 4 numbers | A line per item, plus who had it |
| What "correct" means to them | Shares add up exactly to what they paid | Each person's share matches their own order |
| Split method | Even | By item, with tax and tip in proportion |
