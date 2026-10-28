# Subtitle recovery certificate

This completes the historical inventory recovery in PR #7. It does not merge or deploy it.

The historical snapshot is `f350695ef963a96732fb6fda2efafee1cb003c2f`, immediately before the `a9471fea` “More srts” rewrite. The preserved current snapshot is PR #7's original head, `748567dc100fba17f923076bea918f68c07042bb`.

| Result | Tracks / entries |
| --- | ---: |
| Current SRTs preserved, with identical filenames and text | 15,365 |
| Historical tracks checked | 11,158 |
| Missing historical filename records | 2,556 |
| Missing video/language tracks restored to active bundles | 2,549 |
| Additional missing historical alternatives retained in the archive | 7 |
| All differing historical versions retained in the archive | 1,631 |
| Active SRTs after recovery | 17,914 |
| Index entries added, including previously orphaned current tracks | 2,039 |

The 1,631 archived versions include 1,624 historical tracks whose current filename or text differs, plus the seven alternatives above. Each historical text is now present verbatim in active bundles or in `historical-variants/`. The archive is deliberately separate from active subtitle storage. It preserves older cues and conflicting versions without replacing corrected/current SRTs or creating duplicate active video/language tracks. No same-timestamp text conflicts are automatically resolved.

The old recovery script stopped on `8f4cZIEtktk` because a missing English track had an older filename than its surviving Swedish sibling. Recovery now places the English text under the current indexed base, with a source-to-target filename mapping and SHA-256 in `report.json`. Historical duplicate identities use the version selected by the historical index; differing alternatives remain in the archive.

All restored tracks load using the application's exact index/bundle/base/language lookup. Pack file counts, byte sizes and cache revisions have been verified. `eWKShBhCSCQ` and `gJKWuME2fhc` now have index entries. Existing differing copies remain intact. Three pre-existing metadata-only index entries (`HKLLIUhiSjM`, `wyhwuheitmw`, `Sh_IaRCvUHY`) have no subtitle text in either recovery snapshot and remain metadata-only; they were not dropped or replaced with invented text.

The preservation inventory SHA-256 is `f3882b56794b6c370ff4b4864dfad5c6a4111f1ea44dc19bbdb59a965324bd6f` before and after recovery. `report.json` records every restored track, historical variant, archive hash, and the preserved inventory hash. The original Git commit retains all original bundles; local recovery backups are excluded from commits.

Run from the repository root:

```sh
node --test scripts/recover-srt-inventory.test.mjs
node scripts/verify-srt-recovery.mjs
node scripts/recover-srt-inventory.mjs --apply
git diff --exit-code -- db/language/swedish/srts/ srt-recovery-report/
```

The verification workflow has read-only repository permissions. It checks preservation, historical coverage, loadability, and idempotence; it does not push, merge or deploy anything.
