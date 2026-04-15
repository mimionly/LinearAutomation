import { UserButton } from "@clerk/clerk-react";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function NavUser(_props: NavUserProps) {

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <UserButton
        showName
        appearance={{
          elements: {
            userButtonAvatarBox: "w-8 h-8",
            userButtonOuterIdentifier: "text-sm font-medium",
            rootBox: "w-full justify-start",
            userButtonTrigger: "w-full justify-start hover:bg-neutral-100 rounded-md p-1",
          },
        }}
      />
    </div>
  );
}
