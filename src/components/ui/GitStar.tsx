import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export default function GitHubStarButton({ 
  username = "pranavsinghpatil", 
  repo = "tender", 
  size = "medium", // "small", "medium", or "large"
  darkMode = false
}) {
  const [stars, setStars] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Size mappings
  const sizeClasses = {
    small: "text-xs py-1.5 px-3",
    medium: "text-sm py-2 px-4",
    large: "text-base py-2.5 px-5"
  };
  
  // Fetch repository stats from GitHub API
  useEffect(() => {
    fetch(`https://api.github.com/repos/${username}/${repo}`)
      .then(response => response.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(error => {
        console.error("Error fetching GitHub stats:", error);
      });
  }, [username, repo]);

  const formatCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  // Background and text colors based on dark mode
  const bgColor = darkMode ? "bg-[rgba(80, 252, 149, 0.8)]" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-gray-800";
  const hoverBgColor = darkMode ? "hover:bg-[#6dcc84]" : "hover:bg-gray-50";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <a 
      href={`https://github.com/${username}/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      <button
        className={`flex items-center justify-center ${bgColor} ${hoverBgColor} ${textColor} font-medium border ${borderColor} rounded-full ${sizeClasses[size]} shadow-sm transition-colors duration-200`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          window.open(`https://github.com/${username}/${repo}`, '_blank');
        }}
      >
        <span className="flex items-center">
          <span className="mr-1">Star on GitHub</span>
          <Star className={`mx-1 ${size === "small" ? "w-3 h-3" : size === "medium" ? "w-4 h-4" : "w-5 h-5"} fill-current`} />
          <span className="font-bold ml-1">{formatCount(stars)}</span>
        </span>
      </button>
    </a>
  );
}