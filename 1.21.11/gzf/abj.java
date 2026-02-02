import io.netty.buffer.ByteBuf;
import java.util.HashMap;
import java.util.Map;

public record abj(Map<String, String> b) implements aay<abg> {
   private static final int c = 128;
   private static final int d = 4096;
   private static final int e = 32;
   private static final aao<ByteBuf, Map<String, String>> f = aam.a(HashMap::new, aam.b(128), aam.b(4096), 32);
   public static final aao<ByteBuf, abj> a;

   public abj(Map<String, String> param1) {
      this.b = $$0;
   }

   public aba<abj> a() {
      return abu.c;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public Map<String, String> b() {
      return this.b;
   }

   static {
      a = aao.a(f, abj::b, abj::new);
   }
}
