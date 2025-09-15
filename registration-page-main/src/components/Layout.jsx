import PropTypes from "prop-types";

import { clss } from "../utils/clss";
import { Gradient } from "./Gradient";

export function ContainerLayout({ children, reverse = false }) {
  return (
    <div className={clss(reverse ? "flex-row-reverse" : "flex-row", "flex flex-1 min-h-full")}>
      <section className="relative hidden w-0 flex-1 items-center bg-gradient-to-tr to-green-500 via-blue-400 from-blue-700 lg:flex">
        <Gradient />
      </section>
      <section className="custom-scrollbar flex flex-1 flex-col px-4 py-12 max-h-screen overflow-auto shadow sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        {children}
      </section>
    </div>
  );
}

ContainerLayout.propTypes = {
  children: PropTypes.node.isRequired,
  reverse: PropTypes.bool
}