/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  isSamePath,
  useCollapsible,
  Collapsible,
  isRegexpStringMatch,
  useLocalPathname,
} from '@docusaurus/theme-common';
import type {
  DesktopOrMobileNavBarItemProps,
  Props as DropdownNavbarItemProps,
} from '@theme/NavbarItem/DropdownNavbarItem';
import type { LinkLikeNavbarItemProps } from '@theme/NavbarItem';

import { NavLink } from './DefaultNavbarItem';
import NavbarItem from '@theme/NavbarItem';

const dropdownLinkActiveClass = 'dropdown__link--active';

interface ExtendedDropdownNavbarItemProps extends DropdownNavbarItemProps {
  isDropdownItem: boolean;
}

function isItemActive(
  item: LinkLikeNavbarItemProps,
  localPathname: string,
): boolean {
  if (isSamePath(item.to, localPathname)) {
    return true;
  }
  if (isRegexpStringMatch(item.activeBaseRegex, localPathname)) {
    return true;
  }
  if (item.activeBasePath && localPathname.startsWith(item.activeBasePath)) {
    return true;
  }
  return false;
}

function containsActiveItems(
  items: readonly LinkLikeNavbarItemProps[],
  localPathname: string,
): boolean {
  return items.some((item) => isItemActive(item, localPathname));
}

/**
Added function to add support for a changing label in dropdowns
according to the selected dropdown item
**/
function getDropdownProps(props, items, localPathname) {
  const activeItem = items.filter((item) => isItemActive(item, localPathname));
  if (activeItem.length) {
    return {
      ...activeItem[0],
      label: props.label + ' > ' + activeItem[0].label,
    };
  }

  return props;
}

function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  ...props
}: DesktopOrMobileNavBarItemProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLUListElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  /**
  Added const to get the dropdown label if a dropdown item is selected
  **/
  const dropdownProps = getDropdownProps(props, items, useLocalPathname());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        !dropdownRef.current ||
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div
      ref={dropdownRef}
      className={clsx('dropdown', 'dropdown--hoverable', {
        'dropdown--right': position === 'right',
        'dropdown--show': showDropdown,
      })}
    >
      <NavLink
        className={clsx('navbar__item navbar__link', className)}
        {...dropdownProps}
        onClick={props.to ? undefined : (e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }
        }}
      >
        {props.children ?? props.label}
      </NavLink>
      <ul ref={dropdownMenuRef} className='dropdown__menu'>
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            onKeyDown={(e) => {
              if (i === items.length - 1 && e.key === 'Tab') {
                e.preventDefault();
                setShowDropdown(false);
                const nextNavbarItem = dropdownRef.current?.nextElementSibling;
                if (nextNavbarItem) {
                  (nextNavbarItem as HTMLElement).focus();
                }
              }
            }}
            activeClassName={dropdownLinkActiveClass}
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}

function DropdownNavbarItemMobile({
  items,
  className,
  ...props
}: DesktopOrMobileNavBarItemProps) {
  delete props.position;
  const localPathname = useLocalPathname();
  const containsActive = containsActiveItems(items, localPathname);

  const { collapsed, toggleCollapsed, setCollapsed } = useCollapsible({
    initialState: () => !containsActive,
  });

  // Expand/collapse if any item active after a navigation
  useEffect(() => {
    if (containsActive) {
      setCollapsed(!containsActive);
    }
  }, [localPathname, containsActive, setCollapsed]);

  return (
    <li
      className={clsx('menu__list-item', {
        'menu__list-item--collapsed': collapsed,
      })}
    >
      <NavLink
        role='button'
        className={clsx('menu__link menu__link--sublist', className)}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          toggleCollapsed();
        }}
      >
        {props.children ?? props.label}
      </NavLink>
      <Collapsible lazy as='ul' className='menu__list' collapsed={collapsed}>
        {items.map((childItemProps, i) => (
          <NavbarItem
            mobile
            isDropdownItem
            onClick={props.onClick}
            activeClassName='menu__link--active'
            {...childItemProps}
            key={i}
          />
        ))}
      </Collapsible>
    </li>
  );
}

function DropdownNavbarItem({
  mobile = false,
  ...props
}: ExtendedDropdownNavbarItemProps): JSX.Element {
  delete props.isDropdownItem;
  const Comp = mobile ? DropdownNavbarItemMobile : DropdownNavbarItemDesktop;
  return <Comp {...props} />;
}

export default DropdownNavbarItem;
