import React from 'react';

interface ClipPathImageProps {
  imageUrl: string;
  width?: string;
  height?: string;
  alt?: string;
}

function ClipPathImage({ imageUrl, width = "200px", height = "200px", alt = "Clipped Image" }: ClipPathImageProps) {
  return (
    <>
      {/* Hidden SVG with clip path definition */}
      <svg className="absolute -top-[999px] -left-[999px] w-0 h-0">
        <defs>
          <clipPath id="differentone23" clipPathUnits="objectBoundingBox">
            <path
              d="M0 0H0.479167C0.766667 0 1 0.233333 1 0.520833V1H0.520833C0.233333 1 0 0.766667 0 0.479167V0Z"
              fill="black"
            />
          </clipPath>
        </defs>
      </svg>
      
      {/* Image with clip path applied */}
      <figure 
        style={{ 
          clipPath: 'url(#differentone23)',
          width,
          height
        }} 
        className="overflow-hidden"
      >
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </figure>
    </>
  );
}

export default ClipPathImage;
