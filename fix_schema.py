import re

f = r'd:\TourAndTravel\prisma\schema.prisma'
with open(f, 'r', newline='') as fh:
    content = fh.read()

content = content.replace(
    '\thouseRules   Json?           @default("[]")\r\n\tstatus       ListingStatus    @default(DRAFT)',
    '\thouseRules   Json?           @default("[]")\r\n\taccommodations Json?          @default("[]")\r\n\tstatus       ListingStatus    @default(DRAFT)'
)

with open(f, 'w', newline='') as fh:
    fh.write(content)

print('Done')
