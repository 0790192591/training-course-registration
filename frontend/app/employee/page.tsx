
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Course = {
  id: number;
  title: string;
  seats: number;
};

type Registration = {
  id: number;
  employee_id: string;
  course: number;
};

type CourseMaterial = {
  id: number;
  course: number;
  title: string;
  file_path: string;
  created_at: string;
};

const API = "https://training-course-registration.onrender.com/api";

const MENU_ITEMS = [
  { id: "overview", label: "System Overview" },
  { id: "register", label: "Register for a Course" },
  { id: "courses", label: "Available Courses" },
  { id: "materials", label: "Course Materials (PDF)" },
];

const SECTION_TITLES: Record<string, string> = {
  overview: "System Overview",
  register: "Register for a Course",
  courses: "Available Courses",
  materials: "Course Materials (PDF)",
};

export default function EmployeeDashboard() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [courseId, setCourseId] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [activeSection, setActiveSection] = useState("overview");

  async function loadData(token: string) {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [courseResponse, registrationResponse, materialResponse] =
        await Promise.all([
          fetch(`${API}/courses/`),
          fetch(`${API}/registrations/`, { headers }),
          fetch(`${API}/course-materials/`, { headers }),
        ]);

      if (
        registrationResponse.status === 401 ||
        materialResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (
        !courseResponse.ok ||
        !registrationResponse.ok ||
        !materialResponse.ok
      ) {
        throw new Error("Could not load data from the backend.");
      }

      const courseData = await courseResponse.json();
      const registrationData = await registrationResponse.json();
      const materialData = await materialResponse.json();

      setCourses(courseData);
      setRegistrations(registrationData);
      setMaterials(materialData);
    } catch {
      setMessage(
        "Could not connect to the backend. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      await loadData(session.access_token);
    }

    checkSession();
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Unable to log out. Please try again.");
      return;
    }

    router.replace("/login");
  }

  async function handleRegistration(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API}/registrations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_id: employeeId,
          course: Number(courseId),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setMessage("Your session has expired. Please log in again.");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMessage(
          data.error ||
            data.non_field_errors?.[0] ||
            "Registration failed."
        );
        return;
      }

      setMessage("Registration completed successfully!");
      setEmployeeId("");
      setCourseId("");

      await loadData(session.access_token);
    } catch {
      setMessage("Unable to connect to the backend.");
    }
  }

  async function handleDownloadMaterial(materialId: number) {
    setMessage("");
    setDownloadingId(materialId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API}/course-materials/${materialId}/download/`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.download_url) {
        setMessage(data.error || "Unable to open this PDF.");
        return;
      }

      const link = document.createElement("a");
      link.href = data.download_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setMessage("Unable to open PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-blue-900">
          Loading Employee Dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-blue-900 px-6 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">
            Training Course Registration System
          </h1>
          <p className="mt-2 text-blue-100">Employee Dashboard</p>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-6">
        <aside className="h-fit w-full shrink-0 rounded-xl bg-white p-4 shadow lg:sticky lg:top-6 lg:w-64">
          <h2 className="mb-4 px-2 text-lg font-bold text-blue-900">
            Employee Menu
          </h2>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMessage("");
                }}
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
            <p className="mb-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              {message}
            </p>
          )}

          <section className={activeSection === "overview" ? "" : "hidden"}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Available Courses</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {courses.length}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Your Registrations</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {registrations.length}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-6 shadow">
              <h3 className="mb-3 text-lg font-bold">
                Welcome to Employee Dashboard
              </h3>
              <p className="text-slate-600">
                Use the menu on the left to register for training courses,
                view available courses, and access your course PDF materials.
              </p>
            </div>
          </section>

          <section
            className={`rounded-xl bg-white p-6 shadow ${
              activeSection === "register" ? "" : "hidden"
            }`}
          >
            <h2 className="mb-5 text-xl font-bold">Register for a Course</h2>

            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Employee ID</label>
                <input
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                  className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Select Course</label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-700"
                >
                  <option value="">Choose a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!courses.length}
                className="w-full rounded-lg bg-blue-900 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                Submit Registration
              </button>
            </form>
          </section>

          <section
            className={`rounded-xl bg-white p-6 shadow ${
              activeSection === "courses" ? "" : "hidden"
            }`}
          >
            <h2 className="mb-5 text-xl font-bold">Available Courses</h2>

            {courses.length === 0 ? (
              <p className="text-slate-500">No courses available.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((course) => {
                  const registered = registrations.filter(
                    (registration) => registration.course === course.id
                  ).length;

                  return (
                    <div
                      key={course.id}
                      className="rounded-lg border border-slate-200 p-5"
                    >
                      <h3 className="text-lg font-semibold">{course.title}</h3>

                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>
                          Your registrations:{" "}
                          <span className="font-semibold text-blue-900">
                            {registered}
                          </span>
                        </p>

                        <p>
                          Course capacity:{" "}
                          <span className="font-semibold text-blue-900">
                            {course.seats}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCourseId(String(course.id));
                          setActiveSection("register");
                          setMessage("");
                        }}
                        className="mt-4 w-full rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                      >
                        Register for this Course
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className={`rounded-xl bg-white p-6 shadow ${
              activeSection === "materials" ? "" : "hidden"
            }`}
          >
            <h2 className="mb-3 text-xl font-bold">
              Course Materials (PDF)
            </h2>

            <p className="mb-5 text-sm text-slate-600">
              Access PDF learning materials for courses you are registered in.
            </p>

            {materials.length === 0 ? (
              <p className="text-slate-500">
                No PDF materials available yet. Register for a course to access
                its learning materials.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {materials.map((material) => {
                  const course = courses.find(
                    (item) => item.id === material.course
                  );

                  return (
                    <div
                      key={material.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <h3 className="font-semibold">{material.title}</h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Course: {course?.title || "Training course"}
                      </p>

                      <p className="mt-2 break-all text-xs text-slate-400">
                        {material.file_path}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleDownloadMaterial(material.id)}
                        disabled={downloadingId === material.id}
                        className="mt-4 w-full rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        {downloadingId === material.id
                          ? "Opening PDF..."
                          : "Open PDF"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
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
