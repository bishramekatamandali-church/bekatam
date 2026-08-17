import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };
const W = 595, H = 842, M = 45;

function line(page: any, font: any, text: string, x: number, y: number, size = 9) { page.drawText(String(text ?? ""), { x, y, size, font }); }
function wrap(page: any, font: any, text: string, x: number, y: number, width: number, size = 8.5) {
  const words = String(text ?? "").split(/\s+/); let row = "";
  for (const word of words) { const next = row ? `${row} ${word}` : word; if (font.widthOfTextAtSize(next, size) > width && row) { line(page, font, row, x, y, size); y -= 12; row = word; } else row = next; }
  if (row) { line(page, font, row, x, y, size); y -= 12; }
  return y;
}
async function adminClient(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const user = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data, error } = await user.auth.getUser();
  if (error || !data.user) throw new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: CORS });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") throw new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: CORS });
  return admin;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: CORS });
  try {
    const db = await adminClient(req);
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const addSection = (title: string, rows: any[], columns: string[], values: (r: any) => string[]) => {
      let page = pdf.addPage([W, H]); let y = H - 55;
      line(page, bold, "Bishram Ekata Mandali", M, y, 16); y -= 24; line(page, bold, title, M, y, 13); y -= 25;
      line(page, bold, columns.join(" | "), M, y, 8); y -= 16;
      for (const r of rows) {
        const vals = values(r).map(v => String(v ?? "").replace(/\s+/g, " "));
        const text = vals.join(" | ");
        if (y < 55) { page = pdf.addPage([W, H]); y = H - 55; line(page, bold, title + " (continued)", M, y, 13); y -= 24; }
        y = wrap(page, font, text, M, y, W - M * 2, 8.5);
      }
      line(page, font, `Generated ${new Date().toISOString()}`, M, 28, 7);
    };

    const [members, expenses, donations, collections, meetings, decisions, fellowship] = await Promise.all([
      db.from("churchmember").select("full_name, member_status, contact_phone, member_since").order("full_name"),
      db.from("expenserecord").select("expense_date, category, description, amount").order("expense_date", { ascending: false }),
      db.from("donationrecord").select("donation_date, donor_name, purpose, amount").order("donation_date", { ascending: false }),
      db.from("collectionrecord").select("collection_date, purpose, collector_name, amount").order("collection_date", { ascending: false }),
      db.from("meetinglog").select("meeting_date, title, meeting_type, status").order("meeting_date", { ascending: false }),
      db.from("decisionlog").select("decision_date, title, status, made_by").order("decision_date", { ascending: false }),
      db.from("generatedscheduleitem").select("scheduled_date, group_name_or_event_title, location, time_slot").order("scheduled_date", { ascending: false }),
    ]);
    const results = [members, expenses, donations, collections, meetings, decisions, fellowship];
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;

    const totalDonations = (donations.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const totalCollections = (collections.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const totalExpenses = (expenses.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

    { const page = pdf.addPage([W, H]); let y = H - 80; line(page, bold, "Bishram Ekata Mandali", M, y, 20); y -= 30; line(page, bold, "Jumbo Administrative Report", M, y, 16); y -= 45;
      line(page, bold, "Summary", M, y, 12); y -= 22;
      for (const [label, value] of [["Church members", members.data?.length ?? 0], ["Donations", `NPR ${totalDonations.toFixed(2)}`], ["Collections", `NPR ${totalCollections.toFixed(2)}`], ["Expenses", `NPR ${totalExpenses.toFixed(2)}`], ["Net income", `NPR ${(totalDonations + totalCollections - totalExpenses).toFixed(2)}`]]) { line(page, font, `${label}: ${value}`, M, y, 11); y -= 20; }
      line(page, font, "This report combines the administrative datasets used by the Flutter/Supabase application.", M, y - 10, 9); line(page, font, `Generated ${new Date().toISOString()}`, M, 28, 7); }
    addSection("Church Members", members.data ?? [], ["Name", "Status", "Phone", "Member since"], r => [r.full_name, r.member_status, r.contact_phone, r.member_since]);
    addSection("Expenses", expenses.data ?? [], ["Date", "Category", "Description", "Amount"], r => [r.expense_date, r.category, r.description, `NPR ${Number(r.amount ?? 0).toFixed(2)}`]);
    addSection("Donations", donations.data ?? [], ["Date", "Donor", "Purpose", "Amount"], r => [r.donation_date, r.donor_name, r.purpose, `NPR ${Number(r.amount ?? 0).toFixed(2)}`]);
    addSection("Collections", collections.data ?? [], ["Date", "Purpose", "Collector", "Amount"], r => [r.collection_date, r.purpose, r.collector_name, `NPR ${Number(r.amount ?? 0).toFixed(2)}`]);
    addSection("Meetings", meetings.data ?? [], ["Date", "Title", "Type", "Status"], r => [r.meeting_date, r.title, r.meeting_type, r.status]);
    addSection("Decisions", decisions.data ?? [], ["Date", "Title", "Status", "Made by"], r => [r.decision_date, r.title, r.status, r.made_by]);
    addSection("Fellowship Schedules", fellowship.data ?? [], ["Date", "Program", "Location", "Time"], r => [r.scheduled_date, r.group_name_or_event_title, r.location, r.time_slot]);

    const bytes = await pdf.save();
    return new Response(bytes, { status: 200, headers: { ...CORS, "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="jumbo_administrative_report.pdf"' } });
  } catch (err) {
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
