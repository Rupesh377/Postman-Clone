
package com.rupesh.Postman.Clone.Environment.Variable;

import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VariableResolver {

    private final EnvironmentVariableRepository variableRepository;

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^{}]+)}}");

    public String resolve(String text, Long environmentId) {

        if (text == null || text.isBlank() || environmentId == null) {
            return text;
        }

        Matcher matcher = VARIABLE_PATTERN.matcher(text);

        if (!matcher.find()) {
            return text;
        }

        Map<String, String> variables =
                variableRepository.findByEnvironmentId(environmentId)
                        .stream()
                        .collect(Collectors.toMap(variable -> variable.getVariableKey(),
                                variable -> variable.getVariableValue()));

        matcher.reset();
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {

            String variableKey = matcher.group(1).trim();

            String value = variables.get(variableKey);

            if (value == null) {
                value = matcher.group(0);
            }
            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);

        return result.toString();
    }
}
