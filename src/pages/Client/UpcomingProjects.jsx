import { useState, useEffect } from "react";
import { blueOffers, openPage, rabash } from "@/assets/paths";
import PageTitle from "@/UI/PageTitle";
import { deleteProject, getUpcomingdProjects } from "@/Util/Https/companyHttp";
import { useAuth } from "@/context/AuthContext";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 20;

function UpcomingProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    user: { userId, token },
  } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProject({ id, token }),
    onSuccess: () => {
      queryClient.invalidateQueries(["upcoming-projects", userId]);
      toast.success("Project Deleted Successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete project",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
        }
      );
    },
  });

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["upcoming-projects", userId, searchQuery],
    queryFn: ({ pageParam = 1, signal }) =>
      getUpcomingdProjects({
        id: userId,
        token,
        page: pageParam,
        pageSize: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
      }),
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.count / ITEMS_PER_PAGE);
      return pages.length < totalPages ? pages.length + 1 : undefined;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const projects = data?.pages.flatMap((page) => page.items) || [];

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);


  return (
    <div className="bg-background-color">
      <PageTitle
        title="Upcoming Projects"
        subtitle="Projects that haven't been assigned to freelancers"
      />
      <div className="container max-w-screen-xl mx-auto w-full py-[30px] px-4">
        {/* Top Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-[300px]">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded px-3 py-2 pr-10 bg-transparent border border-[#D6D7D7] focus:outline-none focus:ring-2 focus:ring-main-color text-[14px]"
              />
              <img
                src={blueOffers}
                alt="search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div
              key={project?.id}
              className="bg-card-color py-[15px] px-[30px] rounded-lg shadow"
            >
              <div>
                <div className="flex justify-between items-center">
                  <div className="text-[22px] font-bold">{project?.name}</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-main-color">
                      <img src={blueOffers} alt="offers icon" width={20} />
                      <span className="text-[14px] font-medium">
                        {project?.numberOfOffers} Offers
                      </span>
                    </div>
                    <Link to={`/user/project/offer/${project.id}`}>
                      <img
                        src={openPage}
                        alt="view offers"
                        width={20}
                        className="cursor-pointer"
                      />
                    </Link>
                  </div>
                </div>
                <div className="border border-main-color my-3"></div>
                <div className="text-[15px]">
                  <div className="font-semibold mb-2">Project details</div>
                  <div className="font-light">{project?.description}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-[14px]">
                    <span className="font-semibold">Language Pair:</span>{" "}
                    <span className="font-light">
                      {project?.languageFrom?.languageName} (
                      {project?.languageFrom?.languageCode}) -{" "}
                      {project?.languageTo?.languageName} (
                      {project?.languageTo?.languageCode})
                    </span>
                  </div>
                  <div className="text-[14px]">
                    <span className="font-semibold">Category:</span>{" "}
                    <span className="font-light">
                      {project?.specialization?.name}
                    </span>
                  </div>
                  <div className="text-[14px]">
                    <span className="font-semibold">Delivery Time:</span>{" "}
                    <span className="font-light">{project?.days} days</span>
                  </div>
                  <div className="text-[14px]">
                    <span className="font-semibold">Budget:</span>{" "}
                    <span className="font-light">
                      ${project?.minPrice} - ${project?.maxPrice}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => deleteMutation.mutate(project.id)}
                    className="flex items-center gap-2 text-[#FF3B30] hover:opacity-80 transition-opacity"
                  >
                    <img src={rabash} alt="delete" width={20} />
                    <span className="text-[14px] font-medium">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {isFetchingNextPage && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-color mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingProjects;
