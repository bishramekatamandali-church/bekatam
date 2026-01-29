import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../contexts/ContentContext";
import { formatDateADBS } from "../dateConverter";

const languageCopy = {
  title: {
     ne: "कार्यक्रम तालिका सूचना",
    en: "Program Schedule Notices",
  },
  description: {
     ne: "यहाँ कार्यक्रम तालिकाहरू छन्। खोज, फिल्टर र विवरण हेर्न सक्नुहुन्छ।",
    en: "Browse public program schedules. Search, filter, and review program details easily.",
  },
  nepali: { ne: "नेपाली", en: "Nepali" },
  english: { ne: "अंग्रेजी", en: "English" },

  searchLabel: { ne: "खोज्नुहोस्", en: "Search" },
  searchPlaceholder: {
    ne: "शीर्षक, स्थान, जिम्मेवारी, सम्पर्क...",
    en: "Title, location, responsibility, contact...",
  },
  searchButton: { ne: "खोज", en: "Search" },
  clear: { ne: "हटाउनुहोस्", en: "Clear" },

  filters: { ne: "फिल्टर", en: "Filters" },
  showAll: { ne: "सबै", en: "All" },
  showUpcoming: { ne: "आगामी", en: "Upcoming" },
  showPast: { ne: "सम्पन्न", en: "Past" },

  categoryLabel: { ne: "वर्ग", en: "Category" },
  upcoming: { ne: "आगामी", en: "Upcoming" },
  past: { ne: "सम्पन्न", en: "Past" },

  dateLabel: { ne: "मिति", en: "Date" },
  timeLabel: { ne: "समय", en: "Time" },
  locationLabel: { ne: "स्थान", en: "Location" },
  contactLabel: { ne: "सम्पर्क", en: "Contact" },
  responsibilitiesLabel: { ne: "जिम्मेवारीहरू", en: "Responsibilities" },
  detailsLabel: { ne: "कार्यक्रम विवरण", en: "Program details" },

  compactView: { ne: "संक्षिप्त सूची", en: "Compact list" },
  detailedView: { ne: "विस्तृत कार्ड", en: "Detailed cards" },

  emptyState: {
    ne: "हाल कुनै सूचना फेला परेन। कृपया खोज/फिल्टर परिवर्तन गर्नुहोस् वा पछि पुनः प्रयास गर्नुहोस्।",
    en: "No notices found. Try adjusting your search/filters or check back soon.",
  },
  viewDetails: { ne: "विवरण हेर्नुहोस्", en: "View details" },
  results: { ne: "परिणाम", en: "Results" },
  showing: { ne: "देखाइएको", en: "Showing" },
};

type Language = "ne" | "en";

type NoticeItem = {
  id: string;
  category: string;
  title: string;
  date: string;
  timeSlot: string;
  location?: string;
  contactNumber?: string;
  responsibilities?: { role: string; assignedTo: string }[];
  details?: string;
  linkPath: string;
};

const normalizeNoticeDate = (dateValue: string) =>
  dateValue.includes("T") ? dateValue.split("T")[0] : dateValue;
const toNoticeDate = (dateValue: string) => new Date(`${normalizeNoticeDate(dateValue)}T00:00:00`);
const NEPAL_TIMEZONE_OFFSET = "+05:45";

const parseTimeSlotEnd = (timeSlot?: string): { hour: number; minute: number } | null => {
  if (!timeSlot) return null;
  const matches = Array.from(timeSlot.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi));
  if (matches.length === 0) return null;

  const lastMatch = matches[matches.length - 1];
  const hourPart = Number(lastMatch[1]);
  const minutePart = Number(lastMatch[2] ?? "0");
  const period = lastMatch[3]?.toUpperCase();

  if (Number.isNaN(hourPart) || Number.isNaN(minutePart) || !period) return null;

  let hour = hourPart % 12;
  if (period === "PM") hour += 12;

  return { hour, minute: minutePart };
};

const getNoticeEndDate = (dateValue: string, timeSlot: string): Date => {
  const normalizedDate = normalizeNoticeDate(dateValue);
  const endTime = parseTimeSlotEnd(timeSlot);
  const hour = endTime?.hour ?? 23;
  const minute = endTime?.minute ?? 59;
  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return new Date(`${normalizedDate}T${timeString}:00${NEPAL_TIMEZONE_OFFSET}`);
};

const pillBase =
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition";
const chipBase =
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition";

const NoticesPage: React.FC = () => {
  const { fellowshipRosters, generatedSchedules, loadingContent } = useContent();
  const [language, setLanguage] = useState<Language>("ne");

  // search
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // filters
  const [whenFilter, setWhenFilter] = useState<"all" | "upcoming" | "past">("all");
  
  // sort + view
  const [viewMode, setViewMode] = useState<"detailed" | "compact">("detailed");

  const now = new Date();

  const copy = (key: keyof typeof languageCopy) => languageCopy[key][language];

  const notices = useMemo<NoticeItem[]>(() => {
    const rosterNotices = fellowshipRosters.map((item) => ({
      id: `manual-${item.id}`,
      category: item.rosterType,
      title: item.groupNameOrEventTitle,
      date: item.assignedDate,
      timeSlot: item.timeSlot,
      location: item.location,
      contactNumber: item.contactNumber,
      responsibilities: item.responsibilities,
      details: item.additionalNotesOrProgramDetails,
      linkPath: item.linkPath || `/fellowship-program/roster/${item.id}`,
    }));

    const scheduleNotices = generatedSchedules.map((item) => ({
      id: `draft-${item.id}`,
      category: item.rosterType,
      title: item.groupNameOrEventTitle,
      date: item.scheduledDate,
      timeSlot: item.timeSlot,
      location: item.location,
      contactNumber: item.contactNumber,
      responsibilities: item.responsibilities,
      details: item.additionalNotesOrProgramDetails,
      linkPath: item.linkPath || `/fellowship-program/schedule/${item.id}`,
    }));

    return [...rosterNotices, ...scheduleNotices];
  }, [fellowshipRosters, generatedSchedules]);

  const filteredNotices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = [...notices].filter((item) => {
      // when filter
      const endDateTime = getNoticeEndDate(item.date, item.timeSlot);
      const isPast = endDateTime.getTime() < now.getTime();
      const isUpcoming = !isPast;
      if (whenFilter === "upcoming" && !isUpcoming) return false;
      if (whenFilter === "past" && isUpcoming) return false;

      // search
      if (!term) return true;
      const haystack = [
        item.title,
        item.category,
        item.location,
        item.details,
        item.timeSlot,
        item.contactNumber,
        ...(item.responsibilities || []).map((entry) => `${entry.role} ${entry.assignedTo}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
    
    const upcomingNotices = filtered
      .filter((item) => getNoticeEndDate(item.date, item.timeSlot).getTime() >= now.getTime())
      .sort((a, b) => toNoticeDate(a.date).getTime() - toNoticeDate(b.date).getTime());

    const pastNotices = filtered
      .filter((item) => getNoticeEndDate(item.date, item.timeSlot).getTime() < now.getTime())
      .sort((a, b) => toNoticeDate(b.date).getTime() - toNoticeDate(a.date).getTime());

    return [...upcomingNotices, ...pastNotices];
  }, [notices, searchTerm, whenFilter, now]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(searchInput);
  };

  const clearAll = () => {
    setSearchInput("");
    setSearchTerm("");
    setWhenFilter("all");
  };

  const totalCount = notices.length;
  const shownCount = filteredNotices.length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-12">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy("title")}</h1>
              <p className="mt-2 text-sm text-slate-600">{copy("description")}</p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 p-1">
              <button
                type="button"
                onClick={() => setLanguage("ne")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  language === "ne" ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {copy("nepali")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  language === "en" ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {copy("english")}
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
            <form className="grid grid-cols-1 gap-4" onSubmit={handleSearchSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="notice-search" className="block text-sm font-medium text-slate-700">
                    {copy("searchLabel")}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="notice-search"
                      type="text"
                      value={searchInput}
                      onChange={(event) => {
                        const v = event.target.value;
                        setSearchInput(v);
                        // Instant search while typing (still keeps submit working)
                        setSearchTerm(v);
                      }}
                      placeholder={copy("searchPlaceholder")}
                      className="w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      {copy("searchButton")}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="rounded-md border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                      {copy("clear")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{copy("filters")}:</span>

                  {/* When filter */}
                  <button
                    type="button"
                    onClick={() => setWhenFilter("all")}
                    className={`${pillBase} ${whenFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    {copy("showAll")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhenFilter("upcoming")}
                    className={`${pillBase} ${whenFilter === "upcoming" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                  >
                    {copy("showUpcoming")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhenFilter("past")}
                    className={`${pillBase} ${whenFilter === "past" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}
                  >
                    {copy("showPast")}
                  </button>

                  {/* View mode */}
                  <span className="mx-1 h-4 w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => setViewMode("detailed")}
                    className={`${chipBase} ${viewMode === "detailed" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {copy("detailedView")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("compact")}
                    className={`${chipBase} ${viewMode === "compact" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {copy("compactView")}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-700">{copy("results")}:</span>{" "}
                    {copy("showing")} {shownCount} / {totalCount}
                  </span>
                  {searchTerm.trim() ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      “{searchTerm.trim()}”
                    </span>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        {loadingContent && notices.length === 0 ? (
          <p className="mt-10 text-center text-lg text-slate-500">Loading notices...</p>
        ) : filteredNotices.length === 0 ? (
          <p className="mx-auto mt-10 max-w-3xl rounded-lg border border-dashed border-indigo-200 bg-indigo-50 px-6 py-8 text-center text-sm text-slate-600">
            {copy("emptyState")}
          </p>
        ) : viewMode === "compact" ? (
          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-200">
              {filteredNotices.map((notice) => {
                const endDateTime = getNoticeEndDate(notice.date, notice.timeSlot);
                const isPast = endDateTime.getTime() < now.getTime();
                const isUpcoming = !isPast;

                return (
                  <Link
                    key={notice.id}
                    to={notice.linkPath}
                    className="block p-4 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {notice.title || "Notice"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatDateADBS(notice.date)} • {notice.timeSlot}
                          {notice.location ? ` • ${notice.location}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {copy("categoryLabel")}: {notice.category}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            isUpcoming ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {isUpcoming ? copy("upcoming") : copy("past")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-4">
            {filteredNotices.map((notice) => {
              const endDateTime = getNoticeEndDate(notice.date, notice.timeSlot);
              const isPast = endDateTime.getTime() < now.getTime();
              const isUpcoming = !isPast;

              return (
                <article
               key={notice.id}  
               className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                          {copy("categoryLabel")}: {notice.category}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 ${
                            isUpcoming ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {isUpcoming ? copy("upcoming") : copy("past")}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-semibold text-slate-800">
                        {notice.title}
                      </h2>
                    </div>

                    <Link
                      to={notice.linkPath}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {copy("viewDetails")}
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <p>
                        <span className="font-semibold text-slate-700">{copy("dateLabel")}: </span>
                        {formatDateADBS(notice.date)}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-slate-700">{copy("timeLabel")}: </span>
                        {notice.timeSlot}
                      </p>
                      {notice.location && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">{copy("locationLabel")}: </span>
                          {notice.location}
                        </p>
                      )}
                      {notice.contactNumber && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">{copy("contactLabel")}: </span>
                          {notice.contactNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      {notice.responsibilities && notice.responsibilities.length > 0 && (
                        <div>
                          <p className="font-semibold text-slate-700">{copy("responsibilitiesLabel")}</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {notice.responsibilities.map((task) => (
                              <li key={task.role + task.assignedTo}>
                                {task.role} - {task.assignedTo}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {notice.details && (
                        <div className="mt-3">
                          <p className="font-semibold text-slate-700">{copy("detailsLabel")}</p>
                          <p className="mt-1 text-sm text-slate-600">{notice.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesPage;
