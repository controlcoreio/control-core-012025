package main


# Add this to your mask.rego policy
masked_data := [mask_record(record) | record := input.context.jsonData[_]]

mask_record(record) = masked {
    masked := object.union(record, {
        "phone": mask_phone(record.phone)
    })
}

mask_phone(number) = masked {
    is_string(number)
    count(number) == 12  # Assuming format like "416-555-1234"
    masked := concat("", ["xxx-xxx-", substring(number, 8, 4)])
}

mask_phone(number) = masked {
    is_string(number)
    count(number) != 12
    # Fallback for other formats
    l := count(number)
    prefix_len := l - 4
    prefix := substring("xxxxxxxxxxxxxxxxxxxxxxxx", 0, prefix_len)
    suffix := substring(number, prefix_len, 4)
    masked := concat("", [prefix, suffix])
}

mask_phone(null) = null 