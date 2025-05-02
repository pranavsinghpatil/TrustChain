import { useState } from 'react';
import { Star, GitFork } from 'lucide-react';

export default function GitHubStarButton({ 
  username = "pranavsinghpatil", 
  repo = "tender-main", 
  showCount = true,
  showForks = false,
  size = "medium" // "small", "medium", or "large"
}) {
  const [stars, setStars] = useState(0);
  const [forks, setForks] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Size mappings
  const sizeClasses = {
    small: "text-xs py-1 px-2",
    medium: "text-sm py-1.5 px-3",
    large: "text-base py-2 px-4"
  };
  
  // Fetch repository stats from GitHub API
  useState(() => {
    fetch(`https://api.github.com/repos/${username}/${repo}`)
      .then(response => response.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
        if (data.forks_count !== undefined) {
          setForks(data.forks_count);
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

  return (
    <div className="flex flex-col space-y-2">
      <a 
        href={`https://github.com/${username}/${repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <div className="flex">
          <button
            className={`flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 rounded-l ${sizeClasses[size]} transition-colors duration-200`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://github.com/${username}/${repo}`, '_blank');
            }}
          >
            <Star className={`mr-1 ${size === "small" ? "w-3 h-3" : size === "medium" ? "w-4 h-4" : "w-5 h-5"}`} />
            Star
          </button>
          
          {showCount && (
            <span 
              className={`flex items-center justify-center bg-white border border-gray-300 border-l-0 rounded-r ${sizeClasses[size]}`}
            >
              {formatCount(stars)}
            </span>
          )}
        </div>
      </a>
      
      {showForks && (
        <a 
          href={`https://github.com/${username}/${repo}/fork`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <div className="flex">
            <button
              className={`flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold border border-gray-300 rounded-l ${sizeClasses[size]} transition-colors duration-200`}
            >
              <GitFork className={`mr-1 ${size === "small" ? "w-3 h-3" : size === "medium" ? "w-4 h-4" : "w-5 h-5"}`} />
              Fork
            </button>
            
            <span 
              className={`flex items-center justify-center bg-white border border-gray-300 border-l-0 rounded-r ${sizeClasses[size]}`}
            >
              {formatCount(forks)}
            </span>
          </div>
        </a>
      )}
    </div>
  );
}