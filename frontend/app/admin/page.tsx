
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Course = {
  id: number;
  title: string;
  seats: number;
  registration_count: number;
  available_seats: number;
};

type Registration = {
  id: number;
  employee_id: string;
  course: string;
  course_id: number;
  supabase_user_id: string | null;
};

type CourseMaterial = {
  id: number;
  course: number;
  title: string;
  file_path: string;
  created_at: string;
};

type AnalyticsItem = {
  course_id: number;
  course: string;
  total_registrations: number;
};

type DashboardData = {
  summary: {
    total_courses: number;
    total_registrations: number;
    total_seats: number;
    available_seats: number;
  };
  courses: Course[];
  registrations: Registration[];
};

const PAGE_SIZE = 5;
const API = "https://training-course-registration.onrender.com/api";

const SECTION_TITLES: Record<string, string> = {
  overview: "System Overview",
  "add-course": "Add New Course",
  courses: "Courses Overview",
  materials: "Course Materials (PDF)",
  analytics: "Course Analytics",
  registrations: "All Registrations",
};

const MENU_ITEMS = [
  { id: "overview", label: "System Overview" },
  { id: "add-course", label: "Add New Course" },
  { id: "courses", label: "Courses Overview" },
  { id: "materials", label: "Course Materials (PDF)" },
  { id: "analytics", label: "Course Analytics" },
  { id: "registrations", label: "All Registrations" },
];

export default function HRDashboard() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [analyticsMessage, setAnalyticsMessage] = useState("");
  const [materialsMessage, setMaterialsMessage] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseSeats, setCourseSeats] = useState("10");
  const [creating, setCreating] = useState(false);

  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSeats, setEditSeats] = useState("10");
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);

  const [courseSearchInput, setCourseSearchInput] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");

  const [courseSortBy, setCourseSortBy] = useState("title");
  const [courseSortAscending, setCourseSortAscending] = useState(true);
  const [coursePage, setCoursePage] = useState(1);

  const [registrationSortBy, setRegistrationSortBy] = useState("id");
  const [registrationSortAscending, setRegistrationSortAscending] =
    useState(false);
  const [registrationPage, setRegistrationPage] = useState(1);

  const [analyticsSortAscending, setAnalyticsSortAscending] = useState(true);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const [downloadingMaterialId, setDownloadingMaterialId] =
    useState<number | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<number | null>(
    null
  );

  async function refreshDashboard(accessToken: string) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(`${API}/admin/dashboard/`, { headers });

    if (!response.ok) {
      throw new Error("Failed to refresh dashboard.");
    }

    const data: DashboardData = await response.json();
    setDashboard(data);

    const analyticsResponse = await fetch(`${API}/analytics/`, { headers });

    if (analyticsResponse.ok) {
      const analyticsData: AnalyticsItem[] =
        await analyticsResponse.json();

      setAnalytics(analyticsData);
      setAnalyticsMessage("");
    } else {
      setAnalyticsMessage("Unable to refresh course analytics.");
    }

    setAnalyticsLoading(false);

    try {
      const materialsResponse = await fetch(`${API}/course-materials/`, {
        headers,
      });

      if (!materialsResponse.ok) {
        throw new Error("Unable to load course materials.");
      }

      const materialsData: CourseMaterial[] =
        await materialsResponse.json();

      setMaterials(materialsData);
      setMaterialsMessage("");
    } catch {
      setMaterialsMessage("Unable to load PDF materials.");
    } finally {
      setMaterialsLoading(false);
    }
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${session.access_token}`,
        };

        const userResponse = await fetch(`${API}/me/`, { headers });

        if (!userResponse.ok) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        const user = await userResponse.json();

        if (user.role !== "admin") {
          router.replace("/");
          return;
        }

        await refreshDashboard(session.access_token);
      } catch {
        setMessage("Unable to load HR Dashboard. Check the backend server.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const filteredCourses = dashboard
    ? dashboard.courses.filter((course) =>
        course.title
          .toLowerCase()
          .includes(courseSearchTerm.toLowerCase().trim())
      )
    : [];

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let result = 0;

    if (courseSortBy === "title") {
      result = a.title.localeCompare(b.title);
    } else if (courseSortBy === "seats") {
      result = a.seats - b.seats;
    } else if (courseSortBy === "registration_count") {
      result = a.registration_count - b.registration_count;
    } else if (courseSortBy === "available_seats") {
      result = a.available_seats - b.available_seats;
    }

    return courseSortAscending ? result : -result;
  });

  const totalCoursePages = Math.max(
    1,
    Math.ceil(sortedCourses.length / PAGE_SIZE)
  );

  const paginatedCourses = sortedCourses.slice(
    (coursePage - 1) * PAGE_SIZE,
    coursePage * PAGE_SIZE
  );

  const sortedRegistrations = dashboard
    ? [...dashboard.registrations].sort((a, b) => {
        let result = 0;

        if (registrationSortBy === "employee_id") {
          result = a.employee_id.localeCompare(b.employee_id);
        } else if (registrationSortBy === "course") {
          result = a.course.localeCompare(b.course);
        } else {
          result = a.id - b.id;
        }

        return registrationSortAscending ? result : -result;
      })
    : [];

  const totalRegistrationPages = Math.max(
    1,
    Math.ceil(sortedRegistrations.length / PAGE_SIZE)
  );

  const paginatedRegistrations = sortedRegistrations.slice(
    (registrationPage - 1) * PAGE_SIZE,
    registrationPage * PAGE_SIZE
  );

  const sortedAnalytics = [...analytics].sort((a, b) => {
    const result = a.course.localeCompare(b.course);
    return analyticsSortAscending ? result : -result;
  });

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateMessage("");

    const title = courseTitle.trim();
    const seats = Number(courseSeats);

    if (!title || !Number.isInteger(seats) || seats < 1) {
      setCreateMessage("Enter a course title and a valid number of seats.");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API}/courses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, seats }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCreateMessage(JSON.stringify(errorData));
        return;
      }

      setCourseTitle("");
      setCourseSeats("10");
      setCreateMessage("Course created successfully!");

      await refreshDashboard(session.access_token);
    } catch {
      setCreateMessage("Unable to connect to the backend server.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditMessage("");

    const title = editTitle.trim();
    const seats = Number(editSeats);

    if (!title || !Number.isInteger(seats) || seats < 1) {
      setEditMessage("Enter a valid course title and capacity.");
      return;
    }

    if (editingCourseId === null) return;

    setUpdatingCourse(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API}/courses/${editingCourseId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, seats }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setEditMessage(JSON.stringify(errorData));
        return;
      }

      setEditingCourseId(null);
      setEditMessage("");

      await refreshDashboard(session.access_token);
    } catch {
      setEditMessage("Unable to connect to the backend server.");
    } finally {
      setUpdatingCourse(false);
    }
  }

  async function handleDeleteCourse(course: Course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?`
    );

    if (!confirmed) return;

    setDeleteMessage("");
    setDeletingCourseId(course.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API}/courses/${course.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorText = "Unable to delete this course.";

        try {
          const errorData = await response.json();
          errorText =
            errorData.detail ||
            errorData.error ||
            JSON.stringify(errorData);
        } catch {
          // Keep default error.
        }

        setDeleteMessage(errorText);
        return;
      }

      setDeleteMessage(`"${course.title}" deleted successfully!`);

      if (editingCourseId === course.id) {
        setEditingCourseId(null);
      }

      await refreshDashboard(session.access_token);
    } catch {
      setDeleteMessage("Unable to connect to the backend server.");
    } finally {
      setDeletingCourseId(null);
    }
  }

  async function handleUploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setMaterialsMessage("");

    const title = uploadTitle.trim();

    if (!title || !uploadCourseId || !uploadFile) {
      setMaterialsMessage(
        "Enter a title, select a course, and choose a PDF file."
      );
      return;
    }

    if (!uploadFile.name.toLowerCase().endsWith(".pdf")) {
      setMaterialsMessage("Please select a PDF file.");
      return;
    }

    setUploadingMaterial(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("course", uploadCourseId);
      formData.append("file", uploadFile);

      const response = await fetch(`${API}/course-materials/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      let responseData: Record<string, unknown> = {};

      try {
        responseData = await response.json();
      } catch {
        // Ignore invalid JSON.
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMaterialsMessage(
          String(
            responseData.error ||
              responseData.detail ||
              JSON.stringify(responseData) ||
              "Unable to upload this PDF."
          )
        );
        return;
      }

      setUploadTitle("");
      setUploadCourseId("");
      setUploadFile(null);
      form.reset();

      setMaterialsMessage("PDF uploaded successfully!");

      await refreshDashboard(session.access_token);
    } catch {
      setMaterialsMessage("Unable to upload PDF. Check the backend server.");
    } finally {
      setUploadingMaterial(false);
    }
  }

  async function handleDownloadMaterial(material: CourseMaterial) {
    setDownloadingMaterialId(material.id);
    setMaterialsMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API}/course-materials/${material.id}/download/`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.download_url) {
        setMaterialsMessage(
          data.error || data.detail || "Unable to open this PDF."
        );
        return;
      }

      const link = document.createElement("a");
      link.href = data.download_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setMaterialsMessage("Unable to open PDF. Please try again.");
    } finally {
      setDownloadingMaterialId(null);
    }
  }

  async function handleDeleteMaterial(material: CourseMaterial) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.title}"?`
    );

    if (!confirmed) return;

    setDeletingMaterialId(material.id);
    setMaterialsMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API}/course-materials/${material.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage = "Unable to delete this PDF.";

        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error || errorData.detail || JSON.stringify(errorData);
        } catch {
          // Keep default error.
        }

        setMaterialsMessage(errorMessage);
        return;
      }

      setMaterialsMessage(`"${material.title}" deleted successfully!`);

      await refreshDashboard(session.access_token);
    } catch {
      setMaterialsMessage("Unable to delete PDF. Please try again.");
    } finally {
      setDeletingMaterialId(null);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Unable to log out. Please try again.");
      return;
    }

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-10 text-slate-800">
        <p className="text-lg font-medium">Loading HR Dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-blue-900 px-6 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold">
            Training Course Registration System
          </h1>
          <p className="mt-2 text-blue-100">HR Dashboard</p>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-6">
        <aside className="w-full shrink-0 rounded-xl bg-white p-4 shadow lg:sticky lg:top-6 lg:h-fit lg:w-64">
          <h2 className="mb-4 px-2 text-lg font-bold text-blue-900">
            Admin Menu
          </h2>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={
                  activeSection === item.id ? "page" : undefined
                }
                className={`rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                  activeSection === item.id
                    ? "bg-blue-900 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-left font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <h2 className="mb-6 text-2xl font-bold text-slate-800">
            {SECTION_TITLES[activeSection]}
          </h2>

          {message && (
            <p className="mb-6 rounded-lg bg-red-50 p-3 text-red-700">
              {message}
            </p>
          )}

          {deleteMessage && (
            <p className="mb-6 rounded-lg bg-slate-100 p-3">
              {deleteMessage}
            </p>
          )}

          {dashboard && (
            <>
              <section
                className={activeSection === "overview" ? "" : "hidden"}
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-white p-6 shadow">
                    <p className="text-sm text-slate-500">Total Courses</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">
                      {dashboard.summary.total_courses}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow">
                    <p className="text-sm text-slate-500">
                      Total Registrations
                    </p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">
                      {dashboard.summary.total_registrations}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow">
                    <p className="text-sm text-slate-500">Total Seats</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">
                      {dashboard.summary.total_seats}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow">
                    <p className="text-sm text-slate-500">Available Seats</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">
                      {dashboard.summary.available_seats}
                    </p>
                  </div>
                </div>
              </section>

              <section
                className={`rounded-xl bg-white p-6 shadow ${
                  activeSection === "add-course" ? "" : "hidden"
                }`}
              >
                <h2 className="mb-5 text-xl font-bold">Add New Course</h2>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="mb-2 block font-medium">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(event) => setCourseTitle(event.target.value)}
                      placeholder="Enter course title"
                      required
                      className="w-full rounded-lg border border-slate-300 p-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Course Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={courseSeats}
                      onChange={(event) => setCourseSeats(event.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 p-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {creating ? "Adding Course..." : "Add Course"}
                  </button>
                </form>

                {createMessage && (
                  <p className="mt-4 rounded-lg bg-slate-100 p-3">
                    {createMessage}
                  </p>
                )}
              </section>

              <section
                className={`rounded-xl bg-white p-6 shadow ${
                  activeSection === "courses" ? "" : "hidden"
                }`}
              >
                <h2 className="mb-5 text-xl font-bold">Courses Overview</h2>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCourseSearchTerm(courseSearchInput);
                    setCoursePage(1);
                  }}
                  className="mb-5 flex flex-wrap gap-3"
                >
                  <input
                    type="text"
                    value={courseSearchInput}
                    onChange={(event) =>
                      setCourseSearchInput(event.target.value)
                    }
                    placeholder="Search course by title..."
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                  >
                    Search Course
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchInput("");
                      setCourseSearchTerm("");
                      setCoursePage(1);
                    }}
                    className="rounded-lg bg-slate-500 px-5 py-3 font-semibold text-white hover:bg-slate-600"
                  >
                    Clear
                  </button>
                </form>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <label className="font-medium">Sort courses by:</label>

                  <select
                    value={courseSortBy}
                    onChange={(event) => {
                      setCourseSortBy(event.target.value);
                      setCoursePage(1);
                    }}
                    className="rounded-lg border border-slate-300 p-2"
                  >
                    <option value="title">Course Title</option>
                    <option value="seats">Capacity</option>
                    <option value="registration_count">Registered</option>
                    <option value="available_seats">Available Seats</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setCourseSortAscending(!courseSortAscending);
                      setCoursePage(1);
                    }}
                    className="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                  >
                    {courseSortAscending ? "Ascending ↑" : "Descending ↓"}
                  </button>
                </div>

                {sortedCourses.length === 0 ? (
                  <p className="text-slate-500">
                    {courseSearchTerm
                      ? "No courses match your search."
                      : "No courses found."}
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="p-3">Course</th>
                            <th className="p-3">Capacity</th>
                            <th className="p-3">Registered</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedCourses.map((course) => (
                            <tr key={course.id} className="border-b">
                              <td className="p-3 font-medium">
                                {course.title}
                              </td>
                              <td className="p-3">{course.seats}</td>
                              <td className="p-3">
                                {course.registration_count}
                              </td>
                              <td className="p-3">
                                {course.available_seats}
                              </td>

                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCourseId(course.id);
                                      setEditTitle(course.title);
                                      setEditSeats(String(course.seats));
                                      setEditMessage("");
                                    }}
                                    className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourse(course)}
                                    disabled={deletingCourseId !== null}
                                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {deletingCourseId === course.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        Page {coursePage} of {totalCoursePages} —{" "}
                        {sortedCourses.length} courses
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCoursePage((page) => Math.max(1, page - 1))
                          }
                          disabled={coursePage === 1}
                          className="rounded-lg bg-slate-200 px-4 py-2 font-medium disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCoursePage((page) =>
                              Math.min(totalCoursePages, page + 1)
                            )
                          }
                          disabled={coursePage >= totalCoursePages}
                          className="rounded-lg bg-blue-900 px-4 py-2 font-medium text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {editingCourseId !== null && (
                  <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <h2 className="mb-5 text-xl font-bold">Edit Course</h2>

                    <form onSubmit={handleUpdateCourse} className="space-y-4">
                      <div>
                        <label className="mb-2 block font-medium">
                          Course Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(event) =>
                            setEditTitle(event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 p-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-medium">
                          Course Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editSeats}
                          onChange={(event) =>
                            setEditSeats(event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 p-3"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={updatingCourse}
                          className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          {updatingCourse ? "Updating..." : "Save Changes"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourseId(null);
                            setEditMessage("");
                          }}
                          className="rounded-lg bg-slate-500 px-5 py-3 font-semibold text-white hover:bg-slate-600"
                        >
                          Cancel
                        </button>
                      </div>

                      {editMessage && (
                        <p className="rounded-lg bg-slate-100 p-3">
                          {editMessage}
                        </p>
                      )}
                    </form>
                  </section>
                )}
              </section>

              <section
                className={`rounded-xl bg-white p-6 shadow ${
                  activeSection === "materials" ? "" : "hidden"
                }`}
              >
                <h2 className="mb-2 text-xl font-bold">
                  Course Materials (PDF)
                </h2>

                <p className="mb-5 text-sm text-slate-600">
                  PDF files are stored in Supabase Storage.
                </p>

                <form
                  onSubmit={handleUploadMaterial}
                  className="mb-8 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="font-semibold">
                    Add Course Material (PDF)
                  </h3>

                  <div>
                    <label className="mb-2 block font-medium">
                      PDF Title
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      placeholder="Enter PDF title"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Select Course
                    </label>
                    <select
                      value={uploadCourseId}
                      onChange={(event) =>
                        setUploadCourseId(event.target.value)
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    >
                      <option value="">Choose a course</option>
                      {dashboard.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-medium">
                      Choose PDF File
                    </label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      required
                      onChange={(event) =>
                        setUploadFile(event.target.files?.[0] || null)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      uploadingMaterial || dashboard.courses.length === 0
                    }
                    className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {uploadingMaterial ? "Uploading PDF..." : "Upload PDF"}
                  </button>
                </form>

                {materialsLoading ? (
                  <p>Loading course materials...</p>
                ) : materials.length === 0 ? (
                  <p className="text-slate-500">
                    No course PDF materials found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {materials.map((material) => {
                      const course = dashboard.courses.find(
                        (item) => item.id === material.course
                      );

                      return (
                        <div
                          key={material.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">{material.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              Course: {course?.title || "Training course"}
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-400">
                              {material.file_path}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadMaterial(material)
                              }
                              disabled={
                                downloadingMaterialId !== null ||
                                deletingMaterialId !== null
                              }
                              className="rounded-lg bg-blue-900 px-5 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                            >
                              {downloadingMaterialId === material.id
                                ? "Preparing PDF..."
                                : "Open PDF"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(material)}
                              disabled={
                                deletingMaterialId !== null ||
                                downloadingMaterialId !== null
                              }
                              className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deletingMaterialId === material.id
                                ? "Deleting..."
                                : "Delete PDF"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {materialsMessage && (
                  <p className="mt-4 rounded-lg bg-blue-50 p-3 text-blue-900">
                    {materialsMessage}
                  </p>
                )}
              </section>

              <section
                className={`rounded-xl bg-white p-6 shadow ${
                  activeSection === "analytics" ? "" : "hidden"
                }`}
              >
                <h2 className="mb-5 text-xl font-bold">Course Analytics</h2>

                {analyticsLoading ? (
                  <p>Loading course analytics...</p>
                ) : analyticsMessage ? (
                  <p className="rounded-lg bg-red-50 p-3 text-red-700">
                    {analyticsMessage}
                  </p>
                ) : analytics.length === 0 ? (
                  <p>No analytics data found.</p>
                ) : (
                  <>
                    <div className="mb-5">
                      <button
                        type="button"
                        onClick={() =>
                          setAnalyticsSortAscending(!analyticsSortAscending)
                        }
                        className="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                      >
                        {analyticsSortAscending
                          ? "Course A–Z ↑"
                          : "Course Z–A ↓"}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="p-3">Course</th>
                            <th className="p-3">Total Registrations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAnalytics.map((item) => (
                            <tr key={item.course_id} className="border-b">
                              <td className="p-3 font-medium">
                                {item.course}
                              </td>
                              <td className="p-3">
                                {item.total_registrations}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              <section
                className={`rounded-xl bg-white p-6 shadow ${
                  activeSection === "registrations" ? "" : "hidden"
                }`}
              >
                <h2 className="mb-5 text-xl font-bold">All Registrations</h2>

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <label className="font-medium">
                    Sort registrations by:
                  </label>

                  <select
                    value={registrationSortBy}
                    onChange={(event) => {
                      setRegistrationSortBy(event.target.value);
                      setRegistrationPage(1);
                    }}
                    className="rounded-lg border border-slate-300 p-2"
                  >
                    <option value="id">Registration Number</option>
                    <option value="employee_id">Employee ID</option>
                    <option value="course">Course</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setRegistrationSortAscending(!registrationSortAscending)
                    }
                    className="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                  >
                    {registrationSortAscending
                      ? "Ascending ↑"
                      : "Descending ↓"}
                  </button>
                </div>

                {dashboard.registrations.length === 0 ? (
                  <p>No registrations found.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b bg-slate-50">
                            <th className="p-3">No.</th>
                            <th className="p-3">Employee ID</th>
                            <th className="p-3">Course</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedRegistrations.map(
                            (registration, index) => (
                              <tr key={registration.id} className="border-b">
                                <td className="p-3">
                                  {(registrationPage - 1) * PAGE_SIZE +
                                    index +
                                    1}
                                </td>
                                <td className="p-3 font-medium">
                                  {registration.employee_id}
                                </td>
                                <td className="p-3">{registration.course}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        Page {registrationPage} of {totalRegistrationPages} —{" "}
                        {sortedRegistrations.length} registrations
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRegistrationPage((page) =>
                              Math.max(1, page - 1)
                            )
                          }
                          disabled={registrationPage === 1}
                          className="rounded-lg bg-slate-200 px-4 py-2 font-medium disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setRegistrationPage((page) =>
                              Math.min(totalRegistrationPages, page + 1)
                            )
                          }
                          disabled={
                            registrationPage >= totalRegistrationPages
                          }
                          className="rounded-lg bg-blue-900 px-4 py-2 font-medium text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-300 bg-white px-4 py-6">
        <div className="flex flex-row flex-nowrap items-center justify-center gap-6 overflow-x-auto text-center text-sm font-bold tracking-wide text-blue-900">
          <p className="whitespace-nowrap">REG NUMBER: 223009090</p>
          <p className="whitespace-nowrap">NAME: NIYIKIZA EMMANUEL</p>
        </div>
      </footer>
    </main>
  );
}
