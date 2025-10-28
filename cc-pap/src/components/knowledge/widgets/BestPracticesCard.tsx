import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function BestPracticesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Practices: Rego &amp; OPA</CardTitle>
        <CardDescription>
          Tips and guidance for writing high-quality authorization policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Structuring Rego Code</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Use clear rule names (e.g., <code>allow</code>, <code>can_approve</code>).</li>
            <li>Comment complex logic for maintainability.</li>
            <li>Modularize with helper rules and imported data.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Optimizing Performance</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Minimize complex nested loops; prefer sets and comprehensions.</li>
            <li>Cache constant data where possible (e.g., user roles).</li>
            <li>Avoid unnecessary iteration over large arrays.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Using OPA Built-ins</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Leverage functions like <code>starts_with</code>, <code>concat</code>, and <code>count</code> for common tasks.</li>
            <li>Use <code>trace(true)</code> for debugging and understanding evaluation paths.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Testing and Debugging</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Write unit tests for policies using OPA’s test framework (<code>test_</code> rules).</li>
            <li>Test both allowed and denied scenarios.</li>
            <li>Use the OPA Playground and <code>trace</code> data for in-depth inspection.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Common Pitfalls</h4>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Confusing assignment (<code>=</code>) with equality check (<code>==</code>).</li>
            <li>Missing <code>default</code> values, which can lead to "undefined" decisions.</li>
            <li>Overly broad rules that bypass necessary checks.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
