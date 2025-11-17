export default function Page() {
    return (
      <div className="flex flex-col overflow-hidden py-64 bg-white max-md:py-24">
        {/* Page Title */}
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-black max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          OUR CONSTITUTION
        </div>
  
        {/* Main Content */}
        <div className="flex flex-col items-start px-14 pt-12 pb-40 mt-32 w-full bg-white max-md:px-5 max-md:pb-24 max-md:mt-10 max-md:max-w-full text-black">
          {/* Constitution Text */}
          <section className="max-w-3xl mx-auto text-lg leading-relaxed">
            <h2 className="text-3xl font-bold mb-6">Preamble</h2>
            <p>
              We, the brothers of the Asian American Brotherhood, have united ourselves in order to forge a stronger sense of unity among Asian Americans in our community and to foster solidarity without coercion. In promoting understanding and bonds across ethnic lines, the Asian American Brotherhood seeks to empower both our members and the communities that we serve.
            </p>
  
            {/* Article I */}
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article I - Circumstance and Necessity</h2>
            <p>
              <strong>Section 1.</strong> Asian Americans at Harvard are divided along various ethnic and socioeconomic lines. Despite our differences, however, all of us are faced with a similar challenge: overcoming obstacles fixed by society based solely on race. We must unite the diversity of our perspectives in order to rise successfully to this challenge.
            </p>
            <p>
              <strong>Section 2.</strong> The various Asian American ethnic groups on campus have neglected to unite for the sake of what should be our common goal: to provide a collective voice for the Asian American community. Consequently, misunderstandings among individual organizations have led to a fragmentation of the Asian American community at Harvard, compromising the unity of our voice and the recognition of our presence.
            </p>
            <p>
              <strong>Section 3.</strong> The absence of unity and the lack of a common goal have resulted in widespread apathy among Asian Americans at Harvard and beyond. We must address this lack of motivation and participation in our culture and identity for, if ignored, it unquestionably exacerbates the current condition of society.
            </p>
            <p>
              <strong>Section 4.</strong> The aforementioned circumstances are the grounds that have given birth to the Asian American Brotherhood. <strong>WE HAVE FORMED OUT OF NECESSITY.</strong> A fraternal social structure allows us to transcend the fundamental constraints inherent in the structure of traditional organizations. Our undying loyalty to one another marks the beginning of a proud tradition.
            </p>
  
            {/* Article II */}
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article II - Means</h2>
            <ul className="list-disc list-inside">
              <li>We shall achieve our goals by committing ourselves to providing service to the communities around us.</li>
              <li>We shall encourage dialogue among our members and the community at large with the explicit goals of communication, understanding, and respect.</li>
              <li>We shall foster an awareness of individual and collective Asian American experiences.</li>
              <li>We shall build a community in which people will interact comfortably, regardless of ethnicity.</li>
              <li>We shall hold social activities and events in order to promote solidarity within our brotherhood and cultivate a positive relationship with our community.</li>
              <li>We shall hold ourselves responsible towards maintaining the integrity of this constitution.</li>
            </ul>
  
            {/* Article III */}
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article III - The Board of Directors</h2>
            <p>
              <strong>Section 1.</strong> For the purposes of coordinating the activities of the AAB, we have instituted a board of directors consisting of a Director of Archives, Director of Service, Director of Finance, Director of Public Relations, and Director of Social Functions. This select committee will ensure the efficient and just operation of our organization.
            </p>
            <p>
              <strong>Section 2.</strong> The Director of Archives holds the responsibility of recording logs of meetings, keeping records of AAB history, and communicating with and informing members within the Brotherhood of our proceedings. Part of this responsibility entails taking attendance at meetings. The Director of Archives runs elections, and coordinates votes for electoral purposes.
            </p>
            <p>
              <strong>Section 3.</strong> The Director of Service holds the responsibility of managing AAB involvement in the community through the coordination and publicity of various community service activities.
            </p>
            <p>
              <strong>Section 4.</strong> The Director of Finance holds the responsibility of handling economic concerns which include, but are not limited to, collecting dues, determining budgets, and managing funds of the Brotherhood.
            </p>
  
            {/* Additional Articles (Abbreviated) */}
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article VII - Requirements</h2>
            <ul className="list-disc list-inside">
              <li>Members must maintain a minimum GPA of 2.5 per semester.</li>
              <li>Members must serve a minimum of 8 hours of community service per month.</li>
              <li>Attendance at official meetings is mandatory unless otherwise approved by the board.</li>
              <li>Members must attend at least one Brotherhood-sponsored event per month.</li>
              <li>The right to vote and run for office is contingent upon good membership standing.</li>
              <li>Membership is open to all Harvard College students regardless of race, creed, color, sex, sexual orientation, or physical disability.</li>
            </ul>
  
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article VIII - Code of Conduct</h2>
            <ul className="list-disc list-inside">
              <li>We shall uphold the integrity of this constitution.</li>
              <li>We shall not take the name of the Brotherhood in vain.</li>
              <li>We shall always uphold gentlemanly behavior.</li>
              <li>We shall represent the Asian American community with pride and dignity.</li>
              <li>We shall treat all members with respect.</li>
            </ul>
  
            {/* Amendments */}
            <h2 className="text-3xl font-bold mt-10 mb-4">Amendments</h2>
            <h3 className="text-xl font-semibold mt-6">Amendment I - Brotherhood Support</h3>
            <p>All members shall come to the aid of another Brother in need.</p>
  
            <h3 className="text-xl font-semibold mt-6">Amendment II - Membership Size & Recruitment</h3>
            <p>The optimal membership size is 25 persons, with an absolute maximum of 40 members.</p>
  
            <h3 className="text-xl font-semibold mt-6">Amendment VI - Recruitment Cycles</h3>
            <p>Recruitment cycles may be canceled or postponed with a two-thirds vote.</p>
          </section>
        </div>
      </div>
    );
  }
