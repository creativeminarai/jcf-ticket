"use client";

import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function UserAuthMenu() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  if (!user) {
    return (
      <div className="flex space-x-4">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          ログイン
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          会員登録
        </Link>
      </div>
    );
  }

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="sr-only">ユーザーメニューを開く</span>
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            {user.email?.[0].toUpperCase() || "U"}
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 text-xs text-gray-500 border-b">
            {user.email}
          </div>
          <Menu.Item>
            {({ active }: { active: boolean }) => (
              <Link
                href="/profile"
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block px-4 py-2 text-sm text-gray-700"
                )}
              >
                マイページ
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }: { active: boolean }) => (
              <Link
                href="/purchases"
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block px-4 py-2 text-sm text-gray-700"
                )}
              >
                購入履歴
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }: { active: boolean }) => (
              <button
                onClick={() => signOut()}
                className={classNames(
                  active ? "bg-gray-100" : "",
                  "block w-full text-left px-4 py-2 text-sm text-gray-700"
                )}
              >
                ログアウト
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 