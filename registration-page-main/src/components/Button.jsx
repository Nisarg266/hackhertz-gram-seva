import PropTypes from "prop-types";

import { clss } from '../utils/clss'

const variants = {
  primary: 'w-full rounded-md bg-blue-600 text-sm/6 text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
  secondary: 'w-full gap-3 rounded-md bg-white text-sm text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent',
  text: ' text-blue-600 hover:text-green-500 bg-transparent'
}

export function Button({ variant = 'primary', className, children, ...props }) {
  className = clss(
    'inline-flex justify-center items-center gap-2 font-semibold rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none',
    variants[variant],
    className,
  )

  return typeof props.href === 'undefined' ? (
    <button type="button" className={className} {...props}>{children}</button>
  ) : (
    <a className={className} {...props}>{children}</a>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'text']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
};