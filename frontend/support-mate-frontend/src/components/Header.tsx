import React from 'react';
import Logo from './Logo';
import LearnReactLink from './LearnReactLink';

const Header = () => (
  <header className="App-header">
    <Logo />
    <p>
      Edit <code>src/App.tsx</code> and save to reload.
    </p>
    <LearnReactLink />
  </header>
);

export default Header; 