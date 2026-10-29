# Missing captured context: CwQNmKM3b04

The Practice card for **fördömelse**, in `Tillåt mig tvivla - Ord`, points to
01:17:38–01:17:46. Its six original cues cover 01:17:35,760–01:17:52,679.

## Confirmed history

- `f350695ef963a96732fb6fda2efafee1cb003c2f`: all six cues are active.
- `a9471feabddbbb3d3ea8faf5bef404c725cc7e7f` (October 28, “More srts”):
  the same track is replaced by eight different cues. None of the six originals
  survives. The new windows are 00:49:20,520–00:49:44,799 and
  01:17:34,199–01:17:35,760.
- Recovery PR #7 retained the original text verbatim in
  `historical-variants/part-0010.json`, but did not activate it. Its policy
  archived every differing historical track, including this case where the
  old and current windows do not conflict. Inventory recovery alone therefore
  did not restore this card's example.
- `6e075167bf3274c338ba37611b9b140faa90885c`, the baseline of this repair,
  still has those eight cues and no occurrence of fördömelse.

This identifies the commit that lost the cues. It does not identify which
local command produced that rewrite. The current browser capture merger and
collector merger both retain all 14 cues when tested with these exact before
and after texts, in either order. This example does not reproduce a defect
in those current merge functions.

## Repair

Use Cupitor's shared capture merger and bundle writer to activate the six
archived cues alongside all eight current cues. Preserve their exact start,
end and text, normalize numbering to 1–14, and retain the original archive.
There are no shared timestamps or overlapping intervals between the two sets.

The active track remains in `packs/pack-000054.json`. The writer increments
the pack revision from 93 to 94, updates its byte size, and updates every
index entry pointing to that pack so cached clients can reload it.

All other 17,913 active subtitle records remain byte-for-byte unchanged,
including filenames and duplicate multiplicity. There are still 17,914 active
records. Repeating the same merge produces no physical changes.

The original recovery certificate describes its immutable recovery snapshot;
this document records the later, intentionally additive change to this one track.
Other archived historical variants are not activated by this targeted repair.

## Verification

`node --test scripts/fordomelse-recovery.test.mjs` independently compares
the repair with the immutable snapshots. It checks the actual loss, the
unchanged archive, the exact 14-cue union, the complete remaining inventory,
index lookup, revision invalidation, and pack limits. The cue and revision
checks fail before this repair. The accompanying workflow is read-only.
