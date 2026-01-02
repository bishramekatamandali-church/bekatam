# Admin Feature Coverage Audit

This audit maps the admin-side capabilities requested in the latest brief to the current backend API surface. It flags which areas already have dedicated endpoints and which still need implementation.

## Features with existing backend routes
- Home slides (`backend/src/api/homeSlides.ts`).
- Sermons (`backend/src/api/sermons.ts`).
- Events (`backend/src/api/events.ts`).
- Ministries (`backend/src/api/ministries.ts`).
- Blog posts (`backend/src/api/blogPosts.ts`).
- News items (`backend/src/api/newsItems.ts`).
- Prayer requests (`backend/src/api/prayerRequests.ts`).
- Testimonials (`backend/src/api/testimonials.ts`).
- Ministry join requests (`backend/src/api/ministryJoinRequests.ts`).
- Contact messages (`backend/src/api/contactMessages.ts`).
- About sections (`backend/src/api/aboutSections.ts`).
- Key persons (`backend/src/api/keyPersons.ts`).
- History milestones (`backend/src/api/historyMilestones.ts`).
- Church history chapters/book content (`backend/src/api/historyChapters.ts`).
- Branch/other churches (`backend/src/api/branchChurches.ts`).
- Collection records (`backend/src/api/collectionRecords.ts`).
- Donation records (`backend/src/api/donationRecords.ts`).
- User management (`backend/src/api/users.ts`).

## Requested areas with no matching backend routes yet
- Direct media uploads and PDF/theme asset management.
- Fellowship schedules and other member-facing rosters.
- Church member records distinct from general users.
- Meeting logs, decision logs, and expense records.
- Dedicated "manage donate" page hooks and financial summaries.
- SEO tooling, activity logging, and advertisement management.
- Editable Contact Us page content (only message submission is present today).

If you want any of the missing areas to be functional from the admin panel, we need to design database models and add new Express routes plus frontend wiring for each item.
