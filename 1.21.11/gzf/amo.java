import com.mojang.brigadier.StringReader;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import com.mojang.brigadier.exceptions.SimpleCommandExceptionType;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import io.netty.buffer.ByteBuf;
import java.util.function.UnaryOperator;
import org.jspecify.annotations.Nullable;

public final class amo implements Comparable<amo> {
   public static final Codec<amo> a;
   public static final aao<ByteBuf, amo> b;
   public static final SimpleCommandExceptionType c;
   public static final char d = ':';
   public static final String e = "minecraft";
   public static final String f = "realms";
   private final String h;
   private final String i;

   private amo(String $$0, String $$1) {
      assert j($$0);

      assert i($$1);

      this.h = $$0;
      this.i = $$1;
   }

   private static amo d(String $$0, String $$1) {
      return new amo(e($$0, $$1), f($$0, $$1));
   }

   public static amo a(String $$0, String $$1) {
      return d($$0, $$1);
   }

   public static amo a(String $$0) {
      return a($$0, ':');
   }

   public static amo b(String $$0) {
      return new amo("minecraft", f("minecraft", $$0));
   }

   @Nullable
   public static amo c(String $$0) {
      return b($$0, ':');
   }

   @Nullable
   public static amo b(String $$0, String $$1) {
      return j($$0) && i($$1) ? new amo($$0, $$1) : null;
   }

   public static amo a(String $$0, char $$1) {
      int $$2 = $$0.indexOf($$1);
      if ($$2 >= 0) {
         String $$3 = $$0.substring($$2 + 1);
         if ($$2 != 0) {
            String $$4 = $$0.substring(0, $$2);
            return d($$4, $$3);
         } else {
            return b($$3);
         }
      } else {
         return b($$0);
      }
   }

   @Nullable
   public static amo b(String $$0, char $$1) {
      int $$2 = $$0.indexOf($$1);
      if ($$2 >= 0) {
         String $$3 = $$0.substring($$2 + 1);
         if (!i($$3)) {
            return null;
         } else if ($$2 != 0) {
            String $$4 = $$0.substring(0, $$2);
            return j($$4) ? new amo($$4, $$3) : null;
         } else {
            return new amo("minecraft", $$3);
         }
      } else {
         return i($$0) ? new amo("minecraft", $$0) : null;
      }
   }

   public static DataResult<amo> d(String $$0) {
      try {
         return DataResult.success(a($$0));
      } catch (s var2) {
         return DataResult.error(() -> {
            return "Not a valid resource location: " + $$0 + " " + var2.getMessage();
         });
      }
   }

   public String a() {
      return this.i;
   }

   public String b() {
      return this.h;
   }

   public amo e(String $$0) {
      return new amo(this.h, f(this.h, $$0));
   }

   public amo a(UnaryOperator<String> $$0) {
      return this.e((String)$$0.apply(this.i));
   }

   public amo f(String $$0) {
      return this.e($$0 + this.i);
   }

   public amo g(String $$0) {
      return this.e(this.i + $$0);
   }

   public String toString() {
      return this.h + ":" + this.i;
   }

   public boolean equals(Object $$0) {
      if (this == $$0) {
         return true;
      } else if (!($$0 instanceof amo)) {
         return false;
      } else {
         amo $$1 = (amo)$$0;
         return this.h.equals($$1.h) && this.i.equals($$1.i);
      }
   }

   public int hashCode() {
      return 31 * this.h.hashCode() + this.i.hashCode();
   }

   public int a(amo $$0) {
      int $$1 = this.i.compareTo($$0.i);
      if ($$1 == 0) {
         $$1 = this.h.compareTo($$0.h);
      }

      return $$1;
   }

   public String c() {
      return this.toString().replace('/', '_').replace(':', '_');
   }

   public String d() {
      return this.h + "." + this.i;
   }

   public String e() {
      return this.h.equals("minecraft") ? this.i : this.d();
   }

   public String f() {
      return this.h.equals("minecraft") ? this.i : this.toString();
   }

   public String h(String $$0) {
      return $$0 + "." + this.d();
   }

   public String c(String $$0, String $$1) {
      return $$0 + "." + this.d() + "." + $$1;
   }

   private static String c(StringReader $$0) {
      int $$1 = $$0.getCursor();

      while($$0.canRead() && a($$0.peek())) {
         $$0.skip();
      }

      return $$0.getString().substring($$1, $$0.getCursor());
   }

   public static amo a(StringReader $$0) throws CommandSyntaxException {
      int $$1 = $$0.getCursor();
      String $$2 = c($$0);

      try {
         return a($$2);
      } catch (s var4) {
         $$0.setCursor($$1);
         throw c.createWithContext($$0);
      }
   }

   public static amo b(StringReader $$0) throws CommandSyntaxException {
      int $$1 = $$0.getCursor();
      String $$2 = c($$0);
      if ($$2.isEmpty()) {
         throw c.createWithContext($$0);
      } else {
         try {
            return a($$2);
         } catch (s var4) {
            $$0.setCursor($$1);
            throw c.createWithContext($$0);
         }
      }
   }

   public static boolean a(char $$0) {
      return $$0 >= '0' && $$0 <= '9' || $$0 >= 'a' && $$0 <= 'z' || $$0 == '_' || $$0 == ':' || $$0 == '/' || $$0 == '.' || $$0 == '-';
   }

   public static boolean i(String $$0) {
      for(int $$1 = 0; $$1 < $$0.length(); ++$$1) {
         if (!b($$0.charAt($$1))) {
            return false;
         }
      }

      return true;
   }

   public static boolean j(String $$0) {
      for(int $$1 = 0; $$1 < $$0.length(); ++$$1) {
         if (!c($$0.charAt($$1))) {
            return false;
         }
      }

      return true;
   }

   private static String e(String $$0, String $$1) {
      if (!j($$0)) {
         throw new s("Non [a-z0-9_.-] character in namespace of location: " + $$0 + ":" + $$1);
      } else {
         return $$0;
      }
   }

   public static boolean b(char $$0) {
      return $$0 == '_' || $$0 == '-' || $$0 >= 'a' && $$0 <= 'z' || $$0 >= '0' && $$0 <= '9' || $$0 == '/' || $$0 == '.';
   }

   private static boolean c(char $$0) {
      return $$0 == '_' || $$0 == '-' || $$0 >= 'a' && $$0 <= 'z' || $$0 >= '0' && $$0 <= '9' || $$0 == '.';
   }

   private static String f(String $$0, String $$1) {
      if (!i($$1)) {
         throw new s("Non [a-z0-9/._-] character in path of location: " + $$0 + ":" + $$1);
      } else {
         return $$1;
      }
   }

   // $FF: synthetic method
   public int compareTo(final Object param1) {
      return this.a((amo)var1);
   }

   static {
      a = Codec.STRING.comapFlatMap(amo::d, amo::toString).stable();
      b = aam.p.a(amo::a, amo::toString);
      c = new SimpleCommandExceptionType(yh.c("argument.id.invalid"));
   }
}
