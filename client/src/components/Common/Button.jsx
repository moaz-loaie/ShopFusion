import React from 'react';

const Button = ({ children, onClick, type = 'button', ...props }) => (
  <button type={type} onClick={onClick} {...props}>
    {children}
  </button>
);

export default Button;
