export const UserRolesEnum = {
    ADIMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member"
}

//making array of values of the keys of the enum, so that it will be available as array also and you can loop through it
export const AvailableUSerRole = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGESS: "in_progress",
    DONE: "done"
}

//making array os task status, Object.values() will take object and make array of its key values
export const AvailableTaskStatus = Object.values(TaskStatusEnum);