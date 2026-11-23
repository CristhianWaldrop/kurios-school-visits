import { Link, type LinkProps } from 'react-router-dom'

import { buttonClassName, type ButtonVariant } from './buttonClassName'

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
}

export function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, className)} {...props} />
}
