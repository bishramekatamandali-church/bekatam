import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../contexts/ContentContext";
import { formatDateADBS, getLocalToday } from "../dateConverter";

const languageCopy = {
  title: {
    ne: "फेलोसिप कार्यक्रम सूचना",
    en: "Fellowship Program Notices",
  },
  description: {
    ne: "यहाँ फेलोसिप कार्यक्रमका सार्वजनिक रोस्टर र तालिकाहरू छन्। खोज, क्रमबद्ध र विवरण हेर्न सक्नुहुन्छ।",
    en: "Browse the public fellowship rosters and schedules. Search, sort, and review program details easily.",
  },
  nepali: { ne: "नेपाली", en: "Nepali" },
  english: { ne: "अंग्रेजी", en: "English" },
  searchLabel: { ne: "खोज्नुहोस्", en: "Search" },
  searchPlaceholder: {
    ne: "कार्यक्रम शीर्षक, स्थान, जिम्मेवारी...",
    en: "Program title, location, responsibility...",
  },
  searchButton: { ne: "खोज", en: "Search" },
  sortLabel: { ne: "क्रमबद्ध गर्नुहोस्", en: "Sort by" },
  sortNewest: { ne: "नयाँदेखि पुराना", en: "Newest first" },
  sortOldest: { ne: "पुरानादेखि नयाँ", en: "Oldest first" },
  rosterTag: { ne: "रोस्टर", en: "Roster" },
  scheduleTag: { ne: "तालिका", en: "Schedule" },
  upcoming: { ne: "आगामी", en: "Upcoming" },
  past: { ne: "सम्पन्न", en: "Past" },
  dateLabel: { ne: "मिति", en: "Date" },
  timeLabel: { ne: "समय", en: "Time" },
  locationLabel: { ne: "स्थान", en: "Location" },
  contactLabel: { ne: "सम्पर्क", en: "Contact" },
  responsibilitiesLabel: { ne: "जिम्मेवारीहरू", en: "Responsibilities" },
  detailsLabel: { ne: "कार्यक्रम विवरण", en: "Program details" },
  emptyState: {
    ne: "हाल कुनै सूचना फेला परेन। कृपया खोज परिवर्तन गर्नुहोस् वा पछि पुनः प्रयास गर्नुहोस्।",
    en: "No notices found. Try adjusting your search or check back soon.",
  },
  viewDetails: { ne: "विवरण हेर्नुहोस्", en: "View details" },
};

type Language = "ne" | "en";

type NoticeItem = {
  id: string;
  itemType: "roster" | "schedule";
  rosterType: string;
  title: string;
  date: string;
  timeSlot: string;
  location?: string;
  contactNumber?: string;
  responsibilities?: { role: string; assignedTo: string }[];
  details?: string;
  linkPath: string;
};

const toNoticeDate = (dateValue: string) => new Date(`${dateValue}T00:00:00`);

const NoticesPage: React.FC = () => {
  const { fellowshipRosters, generatedSchedules, loadingContent } = useContent();
  const [language, setLanguage] = useState<Language>("ne");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const notices = useMemo<NoticeItem[]>(() => {
    const rosterNotices = fellowshipRosters.map((item) => ({
      id: item.id,
      itemType: "roster" as const,
      rosterType: item.rosterType,
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
      id: item.id,
      itemType: "schedule" as const,
      rosterType: item.rosterType,
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
    const sorted = [...notices]
      .filter((item) => {
        if (!term) return true;
        const haystack = [
          item.title,
          item.rosterType,
          item.location,
          item.details,
          item.timeSlot,
          item.contactNumber,
          ...(item.responsibilities || []).map(
            (entry) => `${entry.role} ${entry.assignedTo}`
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        const diff = toNoticeDate(b.date).getTime() - toNoticeDate(a.date).getTime();
        return sortOrder === "newest" ? diff : -diff;
      });

    return sorted;
  }, [notices, searchTerm, sortOrder]);

  const today = getLocalToday();

  const copy = (key: keyof typeof languageCopy) => languageCopy[key][language];

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(searchInput);
  };

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
                  language === "ne"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {copy("nepali")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  language === "en"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {copy("english")}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
            <form
              className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr,0.8fr]"
              onSubmit={handleSearchSubmit}
            >
              <div>
                <label
                  htmlFor="notice-search"
                  className="block text-sm font-medium text-slate-700"
                >
                  {copy("searchLabel")}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="notice-search"
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={copy("searchPlaceholder")}
                    className="w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    {copy("searchButton")}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="notice-sort"
                  className="block text-sm font-medium text-slate-700"
                >
                  {copy("sortLabel")}
                </label>
                <select
                  id="notice-sort"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="mt-2 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="newest">{copy("sortNewest")}</option>
                  <option value="oldest">{copy("sortOldest")}</option>
                </select>
              </div>
            </form>
          </div>
        </div>

        {loadingContent && notices.length === 0 ? (
          <p className="mt-10 text-center text-lg text-slate-500">
            Loading notices...
          </p>
        ) : filteredNotices.length === 0 ? (
          <p className="mx-auto mt-10 max-w-3xl rounded-lg border border-dashed border-indigo-200 bg-indigo-50 px-6 py-8 text-center text-sm text-slate-600">
            {copy("emptyState")}
          </p>
        ) : (
          <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-4">
            {filteredNotices.map((notice) => {
              const noticeDate = toNoticeDate(notice.date);
              const isUpcoming = noticeDate.getTime() >= today.getTime();

              return (
                <article
                  key={`${notice.itemType}-${notice.id}`}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                          {notice.itemType === "roster"
                            ? copy("rosterTag")
                            : copy("scheduleTag")}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                          {notice.rosterType}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 ${
                            isUpcoming
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
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
                        <span className="font-semibold text-slate-700">
                          {copy("dateLabel")}: 
                        </span>
                        {formatDateADBS(notice.date)}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-slate-700">
                          {copy("timeLabel")}: 
                        </span>
                        {notice.timeSlot}
                      </p>
                      {notice.location && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">
                            {copy("locationLabel")}: 
                          </span>
                          {notice.location}
                        </p>
                      )}
                      {notice.contactNumber && (
                        <p className="mt-1">
                          <span className="font-semibold text-slate-700">
                            {copy("contactLabel")}: 
                          </span>
                          {notice.contactNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      {notice.responsibilities && notice.responsibilities.length > 0 && (
                        <div>
                          <p className="font-semibold text-slate-700">
                            {copy("responsibilitiesLabel")}
                          </p>
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
                          <p className="font-semibold text-slate-700">
                            {copy("detailsLabel")}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {notice.details}
                          </p>
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
