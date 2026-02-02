import com.google.common.collect.Lists;
import java.util.List;
import java.util.function.Consumer;

public record aby(acd b) implements aay<abv> {
   private static final int c = 32767;
   public static final aao<wx, aby> a;

   public aby(acd param1) {
      this.b = $$0;
   }

   public aba<aby> a() {
      return abu.o;
   }

   public void a(abv $$0) {
      $$0.a(this);
   }

   public acd b() {
      return this.b;
   }

   static {
      a = acd.a(($$0) -> {
         return ace.a($$0, 32767);
      }, (List)bhs.a((Object)Lists.newArrayList(new acd.c[]{new acd.c(acc.b, acc.a)}), (Consumer)(($$0) -> {
      }))).a(aby::new, aby::b);
   }
}
