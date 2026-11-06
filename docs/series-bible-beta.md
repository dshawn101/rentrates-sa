# Series Bible Generator beta

Canonical page: https://www.publestudio.com/tools/series-bible

The guide is served as HTML, including for visitors without JavaScript. The editor runs in the browser and does not persist or send story notes. The signup link appears after a copy or download action. There is no blog index, AI integration or signup gate.

## First review

1. In Google Search Console, inspect the canonical URL. Once indexed, note the date and filter the Search results performance report to this exact page. Review impressions, clicks and the queries Google reports four weeks after indexing.
2. Read the opt-in activity totals in the Supabase SQL editor:

   ```sql
   select day, event, total
   from private.series_bible_counts
   order by day desc, event;
   ```

   Start counts the first edit or example load. Export counts the first successful copy or initiated download. Signup counts the first click on the free beta link, not an account creation. Each counts once per page load if the user opts in. There are no visitor IDs, cookies, stored inputs or attribution tags. Counts are directional, not unique visitors or an organic-only conversion funnel. The public input accepts only three event names, retains no rows and caps each daily counter at 10,000; automated traffic can still skew counts.
3. If authors export but search impressions are thin, improve distribution and look at the queries that surface. If authors start but rarely export, improve the tool. Use a repeated author question or relevant impression data to select the first supporting article.

No Search Console submission is performed by the app. The URL is included in the sitemap.
