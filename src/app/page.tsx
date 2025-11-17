import * as React from "react";
import { Hero } from "@/app/ui/homepage/Hero";
import { Mission } from "@/app/ui/homepage/Mission";
import { Pillar } from "@/app/ui/homepage/Pillar";

const pillarsData = [
  {
    title: "Service",
    description:
      "AAB believes that the collective organization of passionate individuals serves best to foster a culture of service and transform communities. Whether we are preparing the Harvard Square Homeless Shelter to open its doors for the season, cleaning along the Charles River, or going on Habitat for Humanity builds, we regularly engage in projects to improve the environment and institutions around us. AAB is committed to working with any and all groups who wish to create a more vibrant community based on civic participation and collaborative partnerships.",
    backgroundImage: "/service.jpg",
  },
  {
    title: "Brotherhood",
    description:
      "Since its founding, AAB has guided dozens of young men through their undergraduate careers at Harvard. The group's horizontal structure ensures that every voice is respected, and our close-knit membership provides every member the opportunity to be an active and contributing force within the organization. At its core, AAB is committed to exploring the often neglected issue of Asian American masculinity. We embody the ideal that demographics of all colors and genders should be represented in leadership during and after our time at Harvard.",
    backgroundImage: "/brotherhood.jpg",
  },
  {
    title: "Activism",
    description:
      "Our organization is also a force for political and social consciousness. AAB joins a rich history of ethnic organization on Harvard's campus, promoting discussions on the state of Asian-America through political, cultural, migratory, and even culinary and medical perspectives. AAB is proud to host Reflections, an end-of-year celebration of graduating seniors who have made significant contributions to Asian American community. To raise awareness of Asian American politicians, musical artists, cultural icons, and journalists, AAB has invited to campus many leaders within our community.",
    backgroundImage: "/activism.jpg",
  },
];

export default function Page() {
  return (
    <div className="flex overflow-hidden flex-col pt-0 pb-20 bg-white">
      <Hero backgroundImage="/home-hero.jpeg" />
      <Mission text="We, the brothers of the Asian American Brotherhood, have united ourselves in order to forge a stronger sense of unity among Asian Americans in our community and to foster solidarity without coercion. In promoting understanding and bonds across ethnic lines, the Asian American Brotherhood seeks to empower both our members and the communities that we serve." />

      <div className="gap-2.5 self-start py-2.5 pr-16 pl-14 mt-32 text-8xl text-black max-md:px-10 max-md:mt-10 max-md:max-w-full max-md:text-6xl">
        Three Pillars
      </div>

      <div className="flex flex-col mt-7 w-full text-black max-md:mt-0 max-md:max-w-full">
        {pillarsData.map((pillar, index) => (
          <Pillar
            key={index}
            {...pillar}
            additionalClasses={
              index === 0 ? "mt-10" : "mt-52 max-lg:mt-32 max-md:mt-20"
            } // Adjust first vs. other Pillars
          />
        ))}
      </div>
    </div>
  );
}
